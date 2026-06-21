"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStock = exports.deletePurchase = exports.updatePayment = exports.getPurchaseById = exports.getPurchases = exports.createPurchase = void 0;
const mongoose_1 = require("mongoose");
// src/module/purchase/purchase.service.ts
const mongoose_2 = __importDefault(require("mongoose"));
const purchase_schema_1 = __importDefault(require("./purchase.schema"));
const product_schema_1 = __importDefault(require("../product/product.schema"));
const vendor_schema_1 = __importDefault(require("../vendor/vendor.schema"));
const appError_1 = require("../../middlewares/appError");
const product_variant_schema_1 = __importDefault(require("../product-variant/product-variant.schema"));
const auditLogger_1 = require("../../utils/auditLogger");
const audit_interface_1 = require("../audit/audit.interface");
const sanitizeData_1 = require("../../utils/sanitizeData");
const category_schema_1 = __importDefault(require("../category/category.schema"));
// ─── Helpers ──────────────────────────────────────────────────────────────────
function round2(n) {
    return Math.round(n * 100) / 100;
}
function buildSlug(name) {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
}
function buildProductSku(name) {
    return (name
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .slice(0, 12) +
        "-" +
        Date.now().toString().slice(-5));
}
function buildVariantSku(productSku, color, size) {
    const clean = (s) => s
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .slice(0, 8);
    const sizePart = size.trim() ? `-${clean(size)}` : "";
    return `${productSku}-${clean(color)}-${sizePart}`;
}
// variant attribute lookup key for Map
function variantKey(productId, color, size) {
    return `${productId}|${color.trim().toLowerCase()}|${size.trim().toLowerCase()}`;
}
// ─── Stage 0: Resolve or create vendor ───────────────────
async function resolveVendor(payload, company_id, createdBy, session) {
    // vendor_id provided → find existing
    if (payload.vendor_id) {
        const vendor = await vendor_schema_1.default.findOne({
            _id: new mongoose_2.default.Types.ObjectId(payload.vendor_id),
            company_id,
            is_active: true,
        })
            .session(session)
            .lean();
        if (!vendor)
            throw new appError_1.AppError("Vendor not found", 404);
        return vendor;
    }
    // vendorName provided → create new vendor
    if (payload.vendorName) {
        // check duplicate phone under same company
        if (payload.vendorPhone) {
            const existing = await vendor_schema_1.default.findOne({
                company_id,
                phone: payload.vendorPhone,
            })
                .session(session)
                .lean();
            if (existing) {
                throw new appError_1.AppError(`Vendor with phone ${payload.vendorPhone} already exists`, 409);
            }
        }
        if (!payload.vendorPhone) {
            throw new appError_1.AppError(`Vendor  phone is required`, 400);
        }
        const [created] = await vendor_schema_1.default.create([
            {
                company_id,
                createdBy,
                name: payload.vendorName.trim(),
                phone: payload.vendorPhone,
                email: payload.vendorEmail ?? null,
                // address: null,
                is_active: true,
            },
        ], { session });
        if (!created) {
            throw new appError_1.AppError("Vendor created failed", 500);
        }
        return created;
    }
    // neither provided — zod should catch this but safety net
    throw new appError_1.AppError("Vendor ID or Vendor Name is required", 400);
}
// ─── Stage 1: Bulk upsert categories ─────────────────────────────────────────
async function bulkUpsertCategories(items, company_id, createdBy, session) {
    const map = new Map();
    const withId = items.filter((i) => i.categoryId);
    const withName = items.filter((i) => !i.categoryId && i.categoryName);
    // 1. load existing categories by id
    if (withId.length > 0) {
        const ids = withId.map((i) => new mongoose_2.default.Types.ObjectId(i.categoryId));
        const existing = await category_schema_1.default.find({
            _id: { $in: ids },
            company_id,
        })
            .session(session)
            .lean();
        if (existing.length !== new Set(withId.map((i) => i.categoryId)).size) {
            throw new appError_1.AppError("One or more categories not found", 404);
        }
        // key by both id and name for product stage lookup
        existing.forEach((c) => {
            map.set(c._id.toString(), c._id);
            map.set(c.name.toLowerCase(), c._id);
        });
    }
    // 2. upsert categories by name
    if (withName.length > 0) {
        const uniqueNames = [
            ...new Set(withName.map((i) => i.categoryName.trim().toLowerCase())),
        ];
        const existing = await category_schema_1.default.find({
            company_id,
            name: { $in: uniqueNames.map((n) => new RegExp(`^${n}$`, "i")) },
        })
            .session(session)
            .lean();
        existing.forEach((c) => {
            map.set(c.name.toLowerCase(), c._id);
        });
        // create missing ones
        const missing = uniqueNames.filter((n) => !map.has(n));
        if (missing.length > 0) {
            const created = await category_schema_1.default.insertMany(missing.map((name) => (0, sanitizeData_1.sanitizeData)({
                company_id,
                createdBy,
                name: name.trim(),
                slug: buildSlug(name),
            })), { session });
            created.forEach((c) => map.set(c.name.toLowerCase(), c._id));
        }
    }
    return map;
}
// ─── Stage 2: Bulk upsert products ───────────────────────────────────────────
async function bulkUpsertProducts(items, categoryMap, company_id, createdBy, session, vendor) {
    const map = new Map();
    const withId = items.filter((i) => i.productId);
    const withName = items.filter((i) => !i.productId && i.product_name);
    // ── 1. load existing products by id ───────────────────────
    if (withId.length > 0) {
        const ids = withId.map((i) => new mongoose_2.default.Types.ObjectId(i.productId));
        const existing = await product_schema_1.default.find({
            _id: { $in: ids },
            company_id,
            is_active: true,
        })
            .session(session)
            .lean();
        if (existing.length !== new Set(withId.map((i) => i.productId)).size) {
            throw new appError_1.AppError("One or more products not found", 404);
        }
        existing.forEach((p) => {
            map.set(p._id.toString(), { _id: p._id, sku: p.sku });
            map.set(p.name.toLowerCase(), { _id: p._id, sku: p.sku });
        });
    }
    // ── 2. upsert products by name ────────────────────────────
    if (withName.length > 0) {
        // deduplicate by name
        const uniqueItems = [
            ...new Map(withName.map((i) => [i.product_name.trim().toLowerCase(), i])).values(),
        ];
        const existing = await product_schema_1.default.find({
            company_id,
            name: {
                $in: uniqueItems.map((i) => new RegExp(`^${i.product_name.trim()}$`, "i")),
            },
        })
            .session(session)
            .lean();
        existing.forEach((p) => {
            map.set(p.name.toLowerCase(), { _id: p._id, sku: p.sku });
        });
        // create missing products
        const missing = uniqueItems.filter((i) => !map.has(i.product_name.trim().toLowerCase()));
        if (missing.length > 0) {
            const created = await product_schema_1.default.insertMany(missing.map((i) => {
                // resolve category_id — by categoryId first, then categoryName
                const category_id = i.categoryId
                    ? categoryMap.get(i.categoryId)
                    : categoryMap.get(i.categoryName.trim().toLowerCase());
                if (!category_id) {
                    throw new appError_1.AppError(`Category not resolved for product: "${i.product_name}"`, 500);
                }
                const sku = buildProductSku(i.product_name);
                return {
                    company_id,
                    category_id,
                    name: i.product_name.trim(),
                    slug: buildSlug(i.product_name) + "-" + Date.now(),
                    sku,
                    // ✅ For variant products, these are placeholders (will be updated from variants)
                    buying_price: 0, // Will be updated from variant aggregation
                    selling_price: 0, // Will be updated from variant aggregation
                    profit: 0,
                    profit_margin: 0,
                    has_variants: true,
                    vendor_id: vendor._id,
                    stock: 0, // Will be updated from variant aggregation
                    images: i.images ?? [],
                    is_active: true,
                    createdBy,
                };
            }), { session });
            created.forEach((p) => map.set(p.name.toLowerCase(), { _id: p._id, sku: p.sku }));
        }
    }
    return map;
}
// ─── Stage 3: Bulk upsert variants ───────────────────────────────────────────
async function bulkUpsertVariants(items, productMap, company_id, session) {
    const resolveProduct = (item) => {
        const product = item.productId
            ? productMap.get(item.productId)
            : productMap.get(item.product_name.trim().toLowerCase());
        if (!product) {
            throw new appError_1.AppError(`Product not resolved in variant stage: "${item.product_name}"`, 500);
        }
        return product;
    };
    // ── load all existing variants for these products ─────────
    const productIds = [
        ...new Set(items.map((i) => resolveProduct(i)._id.toString())),
    ].map((id) => new mongoose_2.default.Types.ObjectId(id));
    const existing = await product_variant_schema_1.default.find({
        company_id,
        product_id: { $in: productIds },
        is_active: true,
    })
        .session(session)
        .lean();
    const map = new Map(existing.map((v) => {
        const color = v.attributes?.find((a) => a.key === "color")?.value ?? "";
        const size = v.attributes?.find((a) => a.key === "size")?.value ?? "";
        return [
            variantKey(v.product_id.toString(), color, size),
            { _id: v._id, sku: v.sku },
        ];
    }));
    const toCreate = [];
    const toUpdateStock = [];
    // ── classify each item → create or update ─────────────────
    for (const item of items) {
        const product = resolveProduct(item);
        const key = variantKey(product._id.toString(), item.color, item.size ? item.size : "");
        if (map.has(key)) {
            const variant = existing.find((v) => {
                const c = v.attributes?.find((a) => a.key === "color")?.value ?? "";
                const s = v.attributes?.find((a) => a.key === "size")?.value ?? "";
                return variantKey(v.product_id.toString(), c, s) === key;
            });
            if (variant) {
                toUpdateStock.push({
                    variantId: variant._id,
                    quantity: item.quantity,
                    buying_price: item.unit_price,
                    selling_price: item.selling_price,
                });
            }
        }
        else {
            toCreate.push(item);
        }
    }
    // ── Update existing variants (increment stock, update prices) ──
    if (toUpdateStock.length > 0) {
        await Promise.all(toUpdateStock.map(({ variantId, quantity, buying_price, selling_price }) => product_variant_schema_1.default.findByIdAndUpdate(variantId, {
            $inc: { stock: quantity },
            $set: {
                buying_price: buying_price,
                selling_price: selling_price,
            },
        }, { session })));
    }
    // ── Create new variants ───────────────────────────────────
    if (toCreate.length > 0) {
        const created = await product_variant_schema_1.default.insertMany(toCreate.map((item) => {
            const product = resolveProduct(item);
            const sku = buildVariantSku(product.sku, item.color, item.size ? item.size : "");
            return {
                product_id: product._id,
                company_id,
                sku,
                attributes: [
                    { key: "color", value: item.color.trim() },
                    ...(item.size?.trim()
                        ? [{ key: "size", value: item.size.trim() }]
                        : []),
                ],
                buying_price: item.unit_price,
                selling_price: item.selling_price,
                stock: item.quantity,
                low_stock_alert: item.low_stock_alert ?? 5,
                image: item.images?.[0] ?? null,
                is_active: true,
            };
        }), { session });
        created.forEach((v) => {
            const color = v.attributes?.find((a) => a.key === "color")?.value ?? "";
            const size = v.attributes?.find((a) => a.key === "size")?.value ?? "";
            const key = variantKey(v.product_id.toString(), color, size);
            map.set(key, { _id: v._id, sku: v.sku });
        });
    }
    // ── Sync product aggregated data from variants ────────────
    const affectedProductIds = [
        ...new Set(items.map((i) => resolveProduct(i)._id.toString())),
    ].map((id) => new mongoose_2.default.Types.ObjectId(id));
    // ── Sync product aggregated data from variants ────────────
    await Promise.all(affectedProductIds.map(async (productId) => {
        const agg = await product_variant_schema_1.default.aggregate([
            {
                $match: {
                    product_id: productId,
                    company_id,
                    is_active: true,
                },
            },
            {
                $group: {
                    _id: null,
                    totalStock: { $sum: "$stock" },
                    minPrice: { $min: "$selling_price" },
                    maxPrice: { $max: "$selling_price" },
                    variantCount: { $sum: 1 },
                    hasDiscount: {
                        $sum: {
                            $cond: [
                                {
                                    $or: [
                                        { $gt: ["$discountValue", 0] },
                                        { $ne: ["$discountType", null] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]).session(session);
        if (agg.length > 0) {
            const { totalStock, minPrice, maxPrice, variantCount, hasDiscount } = agg[0];
            // Update product - ONLY stock and display fields
            await product_schema_1.default.findByIdAndUpdate(productId, {
                $set: {
                    // For variant products, these should be 0
                    stock: totalStock,
                    buying_price: 0, // ✅ Not used, set to 0
                    selling_price: 0, // ✅ Not used, set to 0
                    profit: 0,
                    profit_margin: 0,
                    // Display-only derived fields
                    display_price_min: minPrice,
                    display_price_max: maxPrice,
                    total_stock: totalStock,
                    variant_count: variantCount,
                    has_discount: hasDiscount > 0,
                },
            }, { session });
        }
    }));
    return map;
}
// ─── Create purchase ──────────────────────────────────────────────────────────
const createPurchase = async (payload, req) => {
    const { vendor_id, vendorName, vendorEmail, vendorPhone, purchase_date, paid_amount, note, items, company_id, createdBy, } = payload;
    const session = await mongoose_2.default.startSession();
    try {
        let purchase;
        let vendor;
        await session.withTransaction(async () => {
            // state - 0
            vendor = await resolveVendor({
                ...(vendor_id && { vendor_id }),
                ...(vendorName && { vendorName }),
                ...(vendorPhone && { vendorPhone }),
                ...(vendorEmail && { vendorEmail }),
            }, company_id, createdBy, session);
            // ── Stage 1: Categories ──────────────────────────────────────────────
            const categoryMap = await bulkUpsertCategories(items, company_id, createdBy, session);
            // ── Stage 2: Products ────────────────────────────────────────────────
            const productMap = await bulkUpsertProducts(items, categoryMap, company_id, createdBy, session, vendor);
            // ── Stage 3: Variants ────────────────────────────────────────────────
            const variantMap = await bulkUpsertVariants(items, productMap, company_id, session);
            // ── Build resolved line items from maps (zero extra DB calls) ────────
            const resolvedItems = items.map((item) => {
                // lookup by productId first, then name
                const product = item.productId
                    ? productMap.get(item.productId)
                    : productMap.get(item.product_name.trim().toLowerCase());
                if (!product)
                    throw new appError_1.AppError(`Product not resolved: "${item.product_name}"`, 500);
                const key = variantKey(product._id.toString(), item.color, item.size ? item.size : "");
                const variant = variantMap.get(key);
                if (!variant)
                    throw new appError_1.AppError(`Variant not resolved: "${item.product_name}" (${item.color}, ${item.size})`, 500);
                return {
                    product_id: product._id,
                    variant_id: variant._id,
                    product_name: item.product_name?.trim() ?? "",
                    sku: variant.sku,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    selling_price: item.selling_price,
                    total: round2(item.unit_price * item.quantity),
                    color: item.color,
                    size: item.size ?? "",
                };
            });
            if (resolvedItems.length === 0)
                throw new appError_1.AppError("No items resolved — purchase aborted", 400);
            if (resolvedItems.length !== items.length)
                throw new appError_1.AppError(`Expected ${items.length} items but only resolved ${resolvedItems.length}`, 500);
            const total_amount = round2(resolvedItems.reduce((sum, i) => sum + i.total, 0));
            const product_ids = [
                ...new Set(resolvedItems.map((i) => i.product_id.toString())),
            ].map((id) => new mongoose_2.default.Types.ObjectId(id));
            // const purchaseStart = new Date(purchase_date ?? new Date());
            // purchaseStart.setHours(0, 0, 0, 0);
            // const purchaseEnd = new Date(purchaseStart);
            // purchaseEnd.setHours(23, 59, 59, 999);
            // const duplicate = await Purchase.findOne({
            //   company_id,
            //   vendor_id: vendor._id,
            //   product_ids: { $all: product_ids, $size: product_ids.length },
            //   purchase_date: { $gte: purchaseStart, $lte: purchaseEnd },
            // }).session(session);
            // if (duplicate)
            //   throw new AppError(
            //     "A purchase with the same vendor and products already exists for this date",
            //     409,
            //   );
            // ── Create purchase document ─────────────────────────────────────────
            const [created] = await purchase_schema_1.default.create([
                {
                    company_id,
                    vendor_id: vendor._id,
                    items: resolvedItems,
                    product_ids,
                    item_count: resolvedItems.length,
                    total_amount,
                    paid_amount: paid_amount ?? 0,
                    purchase_date: purchase_date ? new Date(purchase_date) : new Date(),
                    note: note ?? null,
                    createdBy,
                },
            ], { session });
            await vendor_schema_1.default.findByIdAndUpdate(vendor._id, [
                // aggregation pipeline update — recalculates due from source fields
                {
                    $set: {
                        total_payable: { $add: ["$total_payable", total_amount] },
                        total_paid: { $add: ["$total_paid", paid_amount ?? 0] },
                        due: {
                            $subtract: [
                                { $add: ["$total_payable", total_amount] },
                                { $add: ["$total_paid", paid_amount ?? 0] },
                            ],
                        },
                    },
                },
            ], { session, updatePipeline: true });
            purchase = created;
        });
        if (!purchase)
            throw new appError_1.AppError("Failed to create purchase", 500);
        (0, auditLogger_1.auditLog)({
            req,
            action: audit_interface_1.AUDIT_ACTIONS.PURCHASE_CREATED,
            targetModel: "Purchase",
            targetId: purchase._id,
            after: {
                vendor_name: vendor.name,
                total_amount: purchase.total_amount,
                item_count: purchase.item_count,
                status: purchase.status,
                total_paid: purchase.paid_amount,
                due_amount: purchase.due_amount,
            },
        });
        return purchase;
    }
    finally {
        await session.endSession();
    }
};
exports.createPurchase = createPurchase;
// ─── Get all purchases (paginated) ────────────────────────
const getPurchases = async (company_id, query) => {
    const filter = { company_id };
    if (query.vendor_id)
        filter.vendor_id = query.vendor_id;
    if (query.status)
        filter.status = query.status;
    if (query.search)
        filter.vendor_name = { $regex: query.search, $options: "i" };
    if (query.vendor_id)
        filter.vendor_id = new mongoose_2.default.Types.ObjectId(query.vendor_id);
    if (query.status)
        filter.status = query.status;
    if (query.from_date || query.to_date) {
        const dateFilter = {};
        if (query.from_date)
            dateFilter.$gte = query.from_date;
        if (query.to_date)
            dateFilter.$lte = query.to_date;
        filter.purchase_date = dateFilter;
    }
    const sortDir = query.sort_order === "asc" ? 1 : -1;
    const [purchases, total] = await Promise.all([
        purchase_schema_1.default.find(filter)
            .populate("vendor_id", "name phone")
            .populate("createdBy", "name email")
            .populate("product_ids", "name sku ")
            .sort({ createdAt: sortDir })
            .skip((query.page - 1) * query.limit)
            .limit(query.limit)
            .lean(),
        purchase_schema_1.default.countDocuments(filter),
    ]);
    return { purchases, total };
};
exports.getPurchases = getPurchases;
// ─── Get one purchase ─────────────────────────────────────
const getPurchaseById = async (payload) => {
    const purchase = await purchase_schema_1.default.findOne({
        _id: payload.id,
        company_id: payload.company_id,
    })
        .populate("vendor_id", "name phone email address total_payable total_paid due")
        .populate("createdBy", "name email")
        .populate("product_ids", "name sku images has_variants buying_price selling_price")
        // .populate("items.variant_id", "sku attributes")
        .lean();
    if (!purchase)
        throw new appError_1.AppError("Purchase not found", 404);
    return purchase;
};
exports.getPurchaseById = getPurchaseById;
// ─── Update purchase (only paid_amount and note) ────────────────────────
const updatePayment = async (id, company_id, payload, req) => {
    const purchase = await purchase_schema_1.default.findOne({ _id: id, company_id }).populate("vendor_id", "name phone email address total_payable total_paid due");
    if (!purchase)
        throw new appError_1.AppError("Purchase not found", 404);
    if (purchase.status === "paid")
        throw new appError_1.AppError("This purchase is already fully paid", 422);
    const before = {
        paid_amount: purchase.paid_amount,
        status: purchase.status,
        due_amount: purchase.due_amount,
    };
    const remaining_due = purchase.total_amount - purchase.paid_amount;
    if (payload.paid_amount > remaining_due) {
        throw new appError_1.AppError(`Paid amount (${payload.paid_amount}) cannot exceed total amount (${remaining_due})`, 422);
    }
    if (payload.paymentMethod !== "cash") {
        throw new appError_1.AppError("Online payment integration is under development. bKash, Nagad, and card support will be available in a future update. Stay tuned!", 400);
    }
    const session = await mongoose_2.default.startSession();
    try {
        await session.withTransaction(async () => {
            purchase.paid_amount += payload.paid_amount;
            if (payload.note)
                purchase.note = payload.note;
            await purchase.save({ session });
            await vendor_schema_1.default.findByIdAndUpdate(purchase.vendor_id, [
                {
                    $set: {
                        total_paid: { $add: ["$total_paid", payload.paid_amount] },
                        due: { $subtract: ["$due", payload.paid_amount] },
                    },
                },
            ], { session, updatePipeline: true });
        });
    }
    finally {
        // catch (error) {
        //   console.log("payment update error",error)
        //   throw new AppError("Failed to update payment", 500);
        // }
        await session.endSession();
    }
    (0, auditLogger_1.auditLog)({
        req,
        action: audit_interface_1.AUDIT_ACTIONS.PURCHASE_PAYMENT_UPDATED,
        targetModel: "Purchase",
        targetId: purchase._id,
        before,
        after: {
            paid_amount: purchase.paid_amount,
            status: purchase.status,
            due_amount: purchase.due_amount,
        },
    });
    return purchase;
};
exports.updatePayment = updatePayment;
const deletePurchase = async (id, company_id, req) => {
    const session = await mongoose_2.default.startSession();
    session.startTransaction();
    try {
        const purchase = await purchase_schema_1.default.findOne({ _id: id, company_id }).session(session);
        if (!purchase)
            throw new appError_1.AppError("Purchase not found", 404);
        // if (purchase.status !== "pending") {
        //   throw new AppError(
        //     `Only pending purchases can be deleted (current status: ${purchase.status})`,
        //     422,
        //   );
        // }
        const before = { total_amount: purchase.total_amount };
        // Reverse vendor financials
        await vendor_schema_1.default.findByIdAndUpdate(purchase.vendor_id, {
            $inc: {
                total_payable: -purchase.total_amount,
                total_paid: -purchase.paid_amount,
                due: -purchase.due_amount,
            },
        }, { session });
        // ── Reverse stock per item, then decide if the variant can be removed ──
        for (const item of purchase.items) {
            await product_variant_schema_1.default.findByIdAndUpdate(item.variant_id, { $inc: { stock: -item.quantity } }, { session });
            const usedElsewhere = await purchase_schema_1.default.exists({
                _id: { $ne: purchase._id },
                company_id,
                "items.variant_id": item.variant_id,
            }).session(session);
            if (!usedElsewhere) {
                // Nobody else stocked this variant — created solely by this purchase.
                await product_variant_schema_1.default.findByIdAndDelete(item.variant_id, { session });
            }
        }
        // ── For each unique product on this purchase, re-sync or remove ──
        for (const productId of purchase.product_ids) {
            const remainingVariants = await product_variant_schema_1.default.find({
                product_id: productId,
            }).session(session);
            if (remainingVariants.length === 0) {
                const usedElsewhere = await purchase_schema_1.default.exists({
                    _id: { $ne: purchase._id },
                    company_id,
                    product_ids: productId,
                }).session(session);
                if (!usedElsewhere) {
                    await product_schema_1.default.findByIdAndDelete(productId, { session });
                }
            }
            else {
                const [totals] = await product_variant_schema_1.default.aggregate([
                    { $match: { product_id: productId } },
                    {
                        $group: {
                            _id: null,
                            total_stock: { $sum: "$stock" },
                            variant_count: { $sum: 1 },
                        },
                    },
                ]).session(session);
                await product_schema_1.default.findByIdAndUpdate(productId, {
                    $set: {
                        total_stock: totals?.total_stock ?? 0,
                        stock: totals?.total_stock ?? 0,
                        variant_count: totals?.variant_count ?? 0,
                    },
                }, { session });
            }
        }
        // Permanently remove the purchase itself
        await purchase_schema_1.default.findByIdAndDelete(id, { session });
        await session.commitTransaction();
        (0, auditLogger_1.auditLog)({
            req,
            action: audit_interface_1.AUDIT_ACTIONS.PURCHASE_DELETED,
            targetModel: "Purchase",
            targetId: purchase._id,
            before,
        });
    }
    catch (err) {
        await session.abortTransaction();
        throw err;
    }
    finally {
        session.endSession();
    }
};
exports.deletePurchase = deletePurchase;
const updateStock = async (req) => {
    const input = req.body;
    const companyId = req.user.company_id;
    const userId = req.user._id;
    if (!companyId || !userId) {
        throw new appError_1.AppError("Unauthorized", 403);
    }
    const { paidAmount, sellingPrice, buyingPrice, quantity, variantId, purchaseDate, note, } = input;
    if (!mongoose_1.Types.ObjectId.isValid(variantId)) {
        throw new appError_1.AppError("Product or variant ID is not found");
    }
    const variant = await product_variant_schema_1.default.findOne({
        company_id: companyId,
        _id: new mongoose_1.Types.ObjectId(variantId),
    }).populate("product_id", "vendor_id name");
    if (!variant) {
        throw new appError_1.AppError("Product variant not found");
    }
    const populatedProduct = variant.product_id;
    if (!mongoose_1.Types.ObjectId.isValid(populatedProduct.vendor_id)) {
        throw new appError_1.AppError("Vendor Id is required", 400);
    }
    const buying_price = variant.buying_price > buyingPrice ? variant.buying_price : buyingPrice;
    const selling_price = variant.selling_price > sellingPrice ? variant.selling_price : sellingPrice;
    const totalPurchase = quantity * buyingPrice;
    const item = {
        product_id: variant.product_id,
        variant_id: variant._id,
        product_name: populatedProduct.name,
        sku: variant.sku,
        color: variant.attributes.find((a) => a.key === "color")?.value ?? "",
        size: variant.attributes.find((a) => a.key === "size")?.value ?? "",
        quantity,
        unit_price: buying_price,
        selling_price: selling_price,
        total: totalPurchase,
    };
    const session = await mongoose_2.default.startSession();
    try {
        session.startTransaction();
        const updateVariant = await product_variant_schema_1.default.findOneAndUpdate({
            company_id: companyId,
            _id: new mongoose_1.Types.ObjectId(variantId),
        }, [
            {
                $set: {
                    stock: { $add: ["$stock", quantity] },
                    buying_price,
                    selling_price,
                },
            },
        ], {
            session,
            returnDocument: "after",
            runValidators: true,
            updatePipeline: true,
        });
        if (!updateVariant) {
            throw new appError_1.AppError("Failed to update stock this variant");
        }
        const updateStockProduct = await product_schema_1.default.findOneAndUpdate({ company_id: companyId, _id: populatedProduct._id }, [
            {
                $set: {
                    stock: { $add: ["$stock", quantity] },
                    total_stock: { $add: ["$total_stock", quantity] },
                    display_price_max: {
                        $cond: {
                            if: {
                                $gte: ["$display_price_max", selling_price],
                            },
                            then: "$display_price_max",
                            else: selling_price,
                        },
                    },
                    display_price_min: {
                        $cond: {
                            if: { $lte: ["$display_price_min", selling_price] },
                            then: "$display_price_min",
                            else: selling_price,
                        },
                    },
                },
            },
        ], {
            session,
            returnDocument: "after",
            runValidators: true,
            updatePipeline: true,
        });
        if (!updateStockProduct) {
            throw new appError_1.AppError("Failed to update variant stock", 400);
        }
        const [newPurchase] = await purchase_schema_1.default.create([
            {
                company_id: companyId,
                vendor_id: populatedProduct.vendor_id,
                items: [item],
                product_ids: [populatedProduct._id],
                item_count: 1,
                total_amount: totalPurchase,
                paid_amount: paidAmount,
                purchase_date: purchaseDate ? new Date(purchaseDate) : new Date(),
                note: note ?? "",
                createdBy: userId,
            },
        ], { session });
        if (!newPurchase) {
            throw new appError_1.AppError("Failed to create purchase");
        }
        const updateVendor = await vendor_schema_1.default.findOneAndUpdate({
            company_id: companyId,
            _id: populatedProduct.vendor_id,
        }, [
            {
                $set: {
                    total_payable: { $add: ["$total_payable", totalPurchase] },
                    total_paid: { $add: ["$total_paid", paidAmount] },
                    due: {
                        $subtract: [
                            { $add: ["$total_payable", totalPurchase] },
                            { $add: ["$total_paid", paidAmount] },
                        ],
                    },
                },
            },
        ], {
            session,
            returnDocument: "after",
            runValidators: true,
            updatePipeline: true,
        });
        if (!updateVendor) {
            throw new appError_1.AppError("Vendor updated failed");
        }
        await session.commitTransaction();
        return updateVariant;
    }
    catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        await session.endSession();
    }
};
exports.updateStock = updateStock;
/*
interface CreatePurchasePayload extends CreatePurchaseInput {
  company_id: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
}

interface ResolvedLineItem {
  product_id: mongoose.Types.ObjectId;
  variant_id: mongoose.Types.ObjectId;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  selling_price: number;
  total: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

// ─── Upsert helpers ───────────────────────────────────────────────────────────

async function upsertCategory(
  name: string,
  company_id: mongoose.Types.ObjectId,
  createdBy: mongoose.Types.ObjectId,
  session: mongoose.ClientSession,
): Promise<mongoose.Types.ObjectId> {
  const existing = await Category.findOne({
    company_id,
    name: { $regex: `^${name.trim()}$`, $options: "i" },
  })
    .session(session)
    .lean<any>();

  if (existing) return existing._id;

  const [created] = await Category.create(
    [
      sanitizeData({
        company_id,
        createdBy,
        name: name.trim(),
        slug: buildSlug(name),
      }),
    ],
    { session },
  );
  if (!created) throw new AppError("Failed to create category", 500);
  return created._id;
}

async function upsertProduct(
  opts: {
    name: string;
    category_id: mongoose.Types.ObjectId;
    vendor_id: mongoose.Types.ObjectId;
    company_id: mongoose.Types.ObjectId;
    buying_price: number;
    selling_price: number;
    createdBy: mongoose.Types.ObjectId;
  },
  session: mongoose.ClientSession,
): Promise<{ product_id: mongoose.Types.ObjectId; product_sku: string }> {
  const existing = await Product.findOne({
    company_id: opts.company_id,
    category_id: opts.category_id,
    name: { $regex: `^${opts.name.trim()}$`, $options: "i" },
  })
    .session(session)
    .lean<any>();

  if (existing) return { product_id: existing._id, product_sku: existing.sku };

  // Build SKU here in the service — do NOT rely on pre-save hook
  // because the hook runs Product.findById() without the session
  // and can't see documents created inside this transaction.
  const baseSku = opts.name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .slice(0, 12);
  const sku = `${baseSku}-${Date.now().toString().slice(-5)}`; // e.g. "COTTON-SHIRT-93201"

  const [created] = await Product.create(
    [
      {
        company_id: opts.company_id,
        category_id: opts.category_id,
        vendor_id: opts.vendor_id,
        name: opts.name.trim(),
        slug: buildSlug(opts.name) + "-" + Date.now(),
        sku,
        buying_price: opts.buying_price,
        selling_price: opts.selling_price,
        has_variants: true,
        stock: 0,
        is_active: true,
        createdBy: opts.createdBy,
      },
    ],
    { session },
  );
  if (!created) throw new AppError("Failed to create product", 500);
  return { product_id: created._id, product_sku: created.sku };
}

async function upsertVariant(
  opts: {
    product_id: mongoose.Types.ObjectId;
    product_sku: string; // ← passed in from upsertProduct
    company_id: mongoose.Types.ObjectId;
    color: string;
    size: string;
    buying_price: number;
    selling_price: number;
    quantity: number;
    low_stock_alert: number;
  },
  session: mongoose.ClientSession,
): Promise<{ variant_id: mongoose.Types.ObjectId; sku: string }> {
  // Find existing variant by product + color + size
  const existing = await ProductVariant.findOne({
    product_id: opts.product_id,
    company_id: opts.company_id,
    attributes: {
      $all: [
        {
          $elemMatch: {
            key: "color",
            value: { $regex: `^${opts.color}$`, $options: "i" },
          },
        },
        {
          $elemMatch: {
            key: "size",
            value: { $regex: `^${opts.size}$`, $options: "i" },
          },
        },
      ],
    },
  }).session(session);

  if (existing) {
    existing.buying_price = opts.buying_price;
    existing.selling_price = opts.selling_price;
    existing.stock += opts.quantity;
    await existing.save({ session });
    return { variant_id: existing._id, sku: existing.sku };
  }

  // Build variant SKU here — NOT in pre-save hook.
  // Same reason: pre-save hook calls Product.findById() without session
  // and the product is invisible inside an uncommitted transaction.
  const clean = (s: string) =>
    s
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .slice(0, 8);
  const varSku = `${opts.product_sku}-${clean(opts.color)}-${clean(opts.size)}`;
  // e.g. "COTTON-SHIRT-93201-ORANGE-M"

  const [created] = await ProductVariant.create(
    [
      {
        product_id: opts.product_id,
        company_id: opts.company_id,
        sku: varSku,
        attributes: [
          { key: "color", value: opts.color.trim() },
          { key: "size", value: opts.size.trim() },
        ],
        buying_price: opts.buying_price,
        selling_price: opts.selling_price,
        stock: opts.quantity,
        low_stock_alert: opts.low_stock_alert,
        is_active: true,
      },
    ],
    { session },
  );
  if (!created) throw new AppError("Failed to create product variant", 500);
  return { variant_id: created._id, sku: created.sku };
}
// ─── Create purchase ──────────────────────────────────────
export const createPurchase = async (
  payload: CreatePurchasePayload,
  req: Request,
) => {
  const {
    vendor_id,
    purchase_date,
    paid_amount,
    note,
    items,
    company_id,
    createdBy,
  } = payload;

  const vendor = await Vendor.findOne({
    _id: vendor_id,
    company_id,
    is_active: true,
  }).lean<any>();
  if (!vendor) throw new AppError("Vendor not found", 404);

  const session = await mongoose.startSession();
  try {
    let purchase: any;

    await session.withTransaction(async () => {
      const resolvedItems: ResolvedLineItem[] = [];

      for (const item of items) {
        // 1. Category — find or create
        const category_id = await upsertCategory(
          item.category,
          company_id,
          createdBy,
          session,
        );

        // 2. Product — find or create
        const { product_id, product_sku } = await upsertProduct(
          {
            name: item.product_name,
            category_id,
            vendor_id: new mongoose.Types.ObjectId(vendor_id),
            company_id,
            buying_price: item.unit_price,
            selling_price: item.selling_price,
            createdBy,
          },
          session,
        );

        // 3. Variant — find or create, stock updated inside
        const { variant_id, sku } = await upsertVariant(
          {
            product_id,
            product_sku,
            company_id,
            color: item.color,
            size: item.size,
            buying_price: item.unit_price,
            selling_price: item.selling_price,
            quantity: item.quantity,
            low_stock_alert: item.low_stock_alert ?? 5,
          },
          session,
        );

        resolvedItems.push({
          product_id,
          variant_id,
          product_name: item.product_name.trim(),
          sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          selling_price: item.selling_price,
          total: round2(item.unit_price * item.quantity),
        });
      }

      const total_amount = round2(
        resolvedItems.reduce((sum, i) => sum + i.total, 0),
      );
      const product_ids = [
        ...new Set(resolvedItems.map((i) => i.product_id.toString())),
      ].map((id) => new mongoose.Types.ObjectId(id));

      const [created] = await Purchase.create(
        [
          {
            company_id,
            vendor_id: new mongoose.Types.ObjectId(vendor_id),
            product_ids,
            item_count: resolvedItems?.length,
            total_amount,
            paid_amount: paid_amount ?? 0,
            purchase_date: purchase_date ? new Date(purchase_date) : new Date(),
            note: note ?? null,
            createdBy,
          },
        ],
        { session },
      );

      purchase = created;
    });
    // ── Guard before auditLog ──────────────────────────────────
    if (!purchase) throw new AppError("Failed to create purchase", 500);

    auditLog({
      req,
      action: AUDIT_ACTIONS.PURCHASE_CREATED,
      targetModel: "Purchase",
      targetId: purchase._id,
      after: {
        vendor_name: vendor.name,
        total_amount: purchase.total_amount,
        item_count: purchase.item_count, // ← use purchase.item_count, not items.length
        status: purchase.status,
        total_paid: purchase.paid_amount,
        due_amount: purchase.due_amount,

      },
    });

    return purchase;
  } finally {
    await session.endSession();
  }
};
*/
//# sourceMappingURL=purchase.service.js.map