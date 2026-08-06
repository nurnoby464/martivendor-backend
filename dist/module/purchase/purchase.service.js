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
// async function resolveVendor(
//   payload: {
//     vendorId?: string;
//     vendorName?: string;
//     vendorPhone?: string;
//     vendorEmail?: string;
//   },
//   sellerId: mongoose.Types.ObjectId,
//   createdBy: mongoose.Types.ObjectId,
//   session: ClientSession,
// ): Promise<IVendorDocument> {
//   // vendorId provided → find existing
//   if (payload.vendorId) {
//     const vendor = await Vendor.findOne({
//       _id: new mongoose.Types.ObjectId(payload.vendorId),
//       sellerId,
//       is_active: true,
//     })
//       .session(session)
//       .lean<any>();
//     if (!vendor) throw new AppError("Vendor not found", 404);
//     return vendor;
//   }
//   // vendorName provided → create new vendor
//   if (payload.vendorName) {
//     // check duplicate phone under same company
//     if (payload.vendorPhone) {
//       const existing = await Vendor.findOne({
//         sellerId,
//         phone: payload.vendorPhone,
//       })
//         .session(session)
//         .lean<any>();
//       if (existing) {
//         throw new AppError(
//           `Vendor with phone ${payload.vendorPhone} already exists`,
//           409,
//         );
//       }
//     }
//     if (!payload.vendorPhone) {
//       throw new AppError(`Vendor  phone is required`, 400);
//     }
//     const [created] = await Vendor.create(
//       [
//         {
//           sellerId,
//           createdBy,
//           name: payload.vendorName.trim(),
//           phone: payload.vendorPhone,
//           email: payload.vendorEmail ?? null,
//           // address: null,
//           is_active: true,
//         },
//       ],
//       { session },
//     );
//     if (!created) {
//       throw new AppError("Vendor created failed", 500);
//     }
//     return created;
//   }
//   // neither provided — zod should catch this but safety net
//   throw new AppError("Vendor ID or Vendor Name is required", 400);
// }
// ─── Stage 1: Bulk upsert categories ─────────────────────────────────────────
async function bulkUpsertCategories(items, sellerId, createdBy, session) {
    const map = new Map();
    const withId = items.filter((i) => i.categoryId);
    const withName = items.filter((i) => !i.categoryId && i.categoryName);
    // 1. load existing categories by id
    if (withId.length > 0) {
        const ids = withId.map((i) => new mongoose_2.default.Types.ObjectId(i.categoryId));
        const existing = await category_schema_1.default.find({
            _id: { $in: ids },
            sellerId,
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
            sellerId,
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
                sellerId,
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
async function bulkUpsertProducts(items, categoryMap, sellerId, createdBy, session) {
    const map = new Map();
    const withId = items.filter((i) => i.productId);
    const withName = items.filter((i) => !i.productId && i.productName);
    // ── 1. load existing products by id ───────────────────────
    if (withId.length > 0) {
        const ids = withId.map((i) => new mongoose_2.default.Types.ObjectId(i.productId));
        const existing = await product_schema_1.default.find({
            _id: { $in: ids },
            sellerId,
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
            ...new Map(withName.map((i) => [i.productName.trim().toLowerCase(), i])).values(),
        ];
        const existing = await product_schema_1.default.find({
            sellerId,
            name: {
                $in: uniqueItems.map((i) => new RegExp(`^${i.productName.trim()}$`, "i")),
            },
        })
            .session(session)
            .lean();
        existing.forEach((p) => {
            map.set(p.name.toLowerCase(), { _id: p._id, sku: p.sku });
        });
        // create missing products
        const missing = uniqueItems.filter((i) => !map.has(i.productName.trim().toLowerCase()));
        if (missing.length > 0) {
            const created = await product_schema_1.default.insertMany(missing.map((i) => {
                // resolve category_id — by categoryId first, then categoryName
                const category_id = i.categoryId
                    ? categoryMap.get(i.categoryId)
                    : categoryMap.get(i.categoryName.trim().toLowerCase());
                if (!category_id) {
                    throw new appError_1.AppError(`Category not resolved for product: "${i.productName}"`, 500);
                }
                const sku = buildProductSku(i.productName);
                return {
                    sellerId,
                    category_id,
                    name: i.productName.trim(),
                    slug: buildSlug(i.productName) + "-" + Date.now(),
                    sku,
                    // ✅ For variant products, these are placeholders (will be updated from variants)
                    buyingPrice: 0, // Will be updated from variant aggregation
                    sellingPrice: 0, // Will be updated from variant aggregation
                    profit: 0,
                    profit_margin: 0,
                    has_variants: true,
                    // vendorId: vendor._id,
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
async function bulkUpsertVariants(items, productMap, sellerId, session) {
    const resolveProduct = (item) => {
        const product = item.productId
            ? productMap.get(item.productId)
            : productMap.get(item.productName.trim().toLowerCase());
        if (!product) {
            throw new appError_1.AppError(`Product not resolved in variant stage: "${item.productName}"`, 500);
        }
        return product;
    };
    // ── load all existing variants for these products ─────────
    const productIds = [
        ...new Set(items.map((i) => resolveProduct(i)._id.toString())),
    ].map((id) => new mongoose_2.default.Types.ObjectId(id));
    const existing = await product_variant_schema_1.default.find({
        sellerId,
        productId: { $in: productIds },
        is_active: true,
    })
        .session(session)
        .lean();
    const map = new Map(existing.map((v) => {
        const color = v.attributes?.find((a) => a.key === "color")?.value ?? "";
        const size = v.attributes?.find((a) => a.key === "size")?.value ?? "";
        return [
            variantKey(v.productId.toString(), color, size),
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
                return variantKey(v.productId.toString(), c, s) === key;
            });
            if (variant) {
                toUpdateStock.push({
                    variantId: variant._id,
                    quantity: item.quantity,
                    buyingPrice: item.buyingPrice,
                    sellingPrice: item.sellingPrice,
                });
            }
        }
        else {
            toCreate.push(item);
        }
    }
    // ── Update existing variants (increment stock, update prices) ──
    if (toUpdateStock.length > 0) {
        await Promise.all(toUpdateStock.map(({ variantId, quantity, buyingPrice, sellingPrice }) => product_variant_schema_1.default.findByIdAndUpdate(variantId, {
            $inc: { stock: quantity },
            $set: {
                buyingPrice: buyingPrice,
                sellingPrice: sellingPrice,
            },
        }, { session })));
    }
    // ── Create new variants ───────────────────────────────────
    if (toCreate.length > 0) {
        const created = await product_variant_schema_1.default.insertMany(toCreate.map((item) => {
            const product = resolveProduct(item);
            const sku = buildVariantSku(product.sku, item.color, item.size ? item.size : "");
            return {
                productId: product._id,
                sellerId,
                sku,
                attributes: [
                    { key: "color", value: item.color.trim() },
                    ...(item.size?.trim()
                        ? [{ key: "size", value: item.size.trim() }]
                        : []),
                ],
                buyingPrice: item.buyingPrice,
                sellingPrice: item.sellingPrice,
                stock: item.quantity,
                lowStockAlert: item.lowStockAlert ?? 5,
                image: item.images?.[0] ?? null,
                is_active: true,
            };
        }), { session });
        created.forEach((v) => {
            const color = v.attributes?.find((a) => a.key === "color")?.value ?? "";
            const size = v.attributes?.find((a) => a.key === "size")?.value ?? "";
            const key = variantKey(v.productId.toString(), color, size);
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
                    productId: productId,
                    sellerId,
                    is_active: true,
                },
            },
            {
                $group: {
                    _id: null,
                    totalStock: { $sum: "$stock" },
                    minPrice: { $min: "$sellingPrice" },
                    maxPrice: { $max: "$sellingPrice" },
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
                    buyingPrice: 0, // ✅ Not used, set to 0
                    sellingPrice: 0, // ✅ Not used, set to 0
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
    const { purchaseDate, paidAmount, note, items, sellerId, createdBy, } = payload;
    const session = await mongoose_2.default.startSession();
    try {
        let purchase;
        // let vendor: any;
        await session.withTransaction(async () => {
            // state - 0
            // vendor = await resolveVendor(
            //   {
            //     ...(vendorId && { vendorId }),
            //     ...(vendorName && { vendorName }),
            //     ...(vendorPhone && { vendorPhone }),
            //     ...(vendorEmail && { vendorEmail }),
            //   },
            //   sellerId,
            //   createdBy,
            //   session,
            // );
            // ── Stage 1: Categories ──────────────────────────────────────────────
            const categoryMap = await bulkUpsertCategories(items, sellerId, createdBy, session);
            // ── Stage 2: Products ────────────────────────────────────────────────
            const productMap = await bulkUpsertProducts(items, categoryMap, sellerId, createdBy, session);
            // ── Stage 3: Variants ────────────────────────────────────────────────
            const variantMap = await bulkUpsertVariants(items, productMap, sellerId, session);
            // ── Build resolved line items from maps (zero extra DB calls) ────────
            const resolvedItems = items.map((item) => {
                // lookup by productId first, then name
                const product = item.productId
                    ? productMap.get(item.productId)
                    : productMap.get(item.productName.trim().toLowerCase());
                if (!product)
                    throw new appError_1.AppError(`Product not resolved: "${item.productName}"`, 500);
                const key = variantKey(product._id.toString(), item.color, item.size ? item.size : "");
                const variant = variantMap.get(key);
                if (!variant)
                    throw new appError_1.AppError(`Variant not resolved: "${item.productName}" (${item.color}, ${item.size})`, 500);
                return {
                    productId: product._id,
                    variantId: variant._id,
                    productName: item.productName?.trim() ?? "",
                    sku: variant.sku,
                    quantity: item.quantity,
                    buyingPrice: item.buyingPrice,
                    sellingPrice: item.sellingPrice,
                    total: round2(item.buyingPrice * item.quantity),
                    color: item.color,
                    size: item.size ?? "",
                };
            });
            if (resolvedItems.length === 0)
                throw new appError_1.AppError("No items resolved — purchase aborted", 400);
            if (resolvedItems.length !== items.length)
                throw new appError_1.AppError(`Expected ${items.length} items but only resolved ${resolvedItems.length}`, 500);
            const totalAmount = round2(resolvedItems.reduce((sum, i) => sum + i.total, 0));
            const productIds = [
                ...new Set(resolvedItems.map((i) => i.productId.toString())),
            ].map((id) => new mongoose_2.default.Types.ObjectId(id));
            // const purchaseStart = new Date(purchase_date ?? new Date());
            // purchaseStart.setHours(0, 0, 0, 0);
            // const purchaseEnd = new Date(purchaseStart);
            // purchaseEnd.setHours(23, 59, 59, 999);
            // const duplicate = await Purchase.findOne({
            //   sellerId,
            //   vendorId: vendor._id,
            //   productIds: { $all: productIds, $size: productIds.length },
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
                    sellerId,
                    // vendorId: vendor._id,
                    items: resolvedItems,
                    productIds,
                    itemCount: resolvedItems.length,
                    totalAmount,
                    paidAmount: paidAmount ?? 0,
                    purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
                    note: note ?? null,
                    createdBy,
                },
            ], { session });
            // await Vendor.findByIdAndUpdate(
            //   vendor._id,
            //   [
            //     // aggregation pipeline update — recalculates due from source fields
            //     {
            //       $set: {
            //         total_payable: { $add: ["$total_payable", totalAmount] },
            //         total_paid: { $add: ["$total_paid", paidAmount ?? 0] },
            //         due: {
            //           $subtract: [
            //             { $add: ["$total_payable", totalAmount] },
            //             { $add: ["$total_paid", paidAmount ?? 0] },
            //           ],
            //         },
            //       },
            //     },
            //   ],
            //   { session, updatePipeline: true },
            // );
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
                // vendor_name: vendor.name,
                totalAmount: purchase.totalAmount,
                item_count: purchase.item_count,
                status: purchase.status,
                total_paid: purchase.paidAmount,
                dueAmount: purchase.dueAmount,
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
const getPurchases = async (sellerId, query) => {
    const filter = { sellerId };
    if (query.vendorId)
        filter.vendorId = query.vendorId;
    if (query.status)
        filter.status = query.status;
    if (query.search)
        filter.vendor_name = { $regex: query.search, $options: "i" };
    if (query.vendorId)
        filter.vendorId = new mongoose_2.default.Types.ObjectId(query.vendorId);
    if (query.status)
        filter.status = query.status;
    if (query.fromDate || query.toDate) {
        const dateFilter = {};
        if (query.fromDate)
            dateFilter.$gte = query.fromDate;
        if (query.toDate)
            dateFilter.$lte = query.toDate;
        filter.purchase_date = dateFilter;
    }
    const sortDir = query.sortOrder === "asc" ? 1 : -1;
    const [purchases, total] = await Promise.all([
        purchase_schema_1.default.find(filter)
            .populate("vendorId", "name phone")
            .populate("createdBy", "name email")
            .populate("productIds", "name sku ")
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
        sellerId: payload.sellerId,
    })
        .populate("vendorId", "name phone email address total_payable total_paid due")
        .populate("createdBy", "name email")
        .populate("productIds", "name sku images has_variants buyingPrice sellingPrice")
        // .populate("items.variantId", "sku attributes")
        .lean();
    if (!purchase)
        throw new appError_1.AppError("Purchase not found", 404);
    return purchase;
};
exports.getPurchaseById = getPurchaseById;
// ─── Update purchase (only paidAmount and note) ────────────────────────
const updatePayment = async (id, sellerId, payload, req) => {
    const purchase = await purchase_schema_1.default.findOne({ _id: id, sellerId }).populate("vendorId", "name phone email address total_payable total_paid due");
    if (!purchase)
        throw new appError_1.AppError("Purchase not found", 404);
    if (purchase.status === "paid")
        throw new appError_1.AppError("This purchase is already fully paid", 422);
    const before = {
        paidAmount: purchase.paidAmount,
        status: purchase.status,
        dueAmount: purchase.dueAmount,
    };
    const remaining_due = purchase.totalAmount - purchase.paidAmount;
    if (payload.paidAmount > remaining_due) {
        throw new appError_1.AppError(`Paid amount (${payload.paidAmount}) cannot exceed total amount (${remaining_due})`, 422);
    }
    if (payload.paymentMethod !== "cash") {
        throw new appError_1.AppError("Online payment integration is under development. bKash, Nagad, and card support will be available in a future update. Stay tuned!", 400);
    }
    const session = await mongoose_2.default.startSession();
    try {
        await session.withTransaction(async () => {
            purchase.paidAmount += payload.paidAmount;
            if (payload.note)
                purchase.note = payload.note;
            await purchase.save({ session });
            await vendor_schema_1.default.findByIdAndUpdate(purchase.vendorId, [
                {
                    $set: {
                        total_paid: { $add: ["$total_paid", payload.paidAmount] },
                        due: { $subtract: ["$due", payload.paidAmount] },
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
            paidAmount: purchase.paidAmount,
            status: purchase.status,
            dueAmount: purchase.dueAmount,
        },
    });
    return purchase;
};
exports.updatePayment = updatePayment;
const deletePurchase = async (id, sellerId, req) => {
    const session = await mongoose_2.default.startSession();
    session.startTransaction();
    try {
        const purchase = await purchase_schema_1.default.findOne({ _id: id, sellerId }).session(session);
        if (!purchase)
            throw new appError_1.AppError("Purchase not found", 404);
        // if (purchase.status !== "pending") {
        //   throw new AppError(
        //     `Only pending purchases can be deleted (current status: ${purchase.status})`,
        //     422,
        //   );
        // }
        const before = { totalAmount: purchase.totalAmount };
        // Reverse vendor financials
        await vendor_schema_1.default.findByIdAndUpdate(purchase.vendorId, {
            $inc: {
                total_payable: -purchase.totalAmount,
                total_paid: -purchase.paidAmount,
                due: -purchase.dueAmount,
            },
        }, { session });
        // ── Reverse stock per item, then decide if the variant can be removed ──
        for (const item of purchase.items) {
            await product_variant_schema_1.default.findByIdAndUpdate(item.variantId, { $inc: { stock: -item.quantity } }, { session });
            const usedElsewhere = await purchase_schema_1.default.exists({
                _id: { $ne: purchase._id },
                sellerId,
                "items.variantId": item.variantId,
            }).session(session);
            if (!usedElsewhere) {
                // Nobody else stocked this variant — created solely by this purchase.
                await product_variant_schema_1.default.findByIdAndDelete(item.variantId, { session });
            }
        }
        // ── For each unique product on this purchase, re-sync or remove ──
        for (const productId of purchase.productIds) {
            const remainingVariants = await product_variant_schema_1.default.find({
                productId: productId,
            }).session(session);
            if (remainingVariants.length === 0) {
                const usedElsewhere = await purchase_schema_1.default.exists({
                    _id: { $ne: purchase._id },
                    sellerId,
                    productIds: productId,
                }).session(session);
                if (!usedElsewhere) {
                    await product_schema_1.default.findByIdAndDelete(productId, { session });
                }
            }
            else {
                const [totals] = await product_variant_schema_1.default.aggregate([
                    { $match: { productId: productId } },
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
    const sellerId = req.user.sellerId;
    const userId = req.user._id;
    if (!sellerId || !userId) {
        throw new appError_1.AppError("Unauthorized", 403);
    }
    const { paidAmount, sellingPrice, buyingPrice, quantity, variantId, purchaseDate, note, } = input;
    if (!mongoose_1.Types.ObjectId.isValid(variantId)) {
        throw new appError_1.AppError("Product or variant ID is not found");
    }
    const variant = await product_variant_schema_1.default.findOne({
        sellerId: sellerId,
        _id: new mongoose_1.Types.ObjectId(variantId),
    }).populate("productId", "vendorId name");
    if (!variant) {
        throw new appError_1.AppError("Product variant not found");
    }
    const populatedProduct = variant.productId;
    // if (!Types.ObjectId.isValid(populatedProduct.vendorId)) {
    //   throw new AppError("Vendor Id is required", 400);
    // }
    const updateBuyingPrice = variant.buyingPrice > buyingPrice ? variant.buyingPrice : buyingPrice;
    const updateSellingPrice = variant.sellingPrice > sellingPrice ? variant.sellingPrice : sellingPrice;
    const totalPurchase = quantity * buyingPrice;
    const item = {
        productId: variant.productId,
        variantId: variant._id,
        productName: populatedProduct.name,
        sku: variant.sku,
        color: variant.attributes.find((a) => a.key === "color")?.value ?? "",
        size: variant.attributes.find((a) => a.key === "size")?.value ?? "",
        quantity,
        buyingPrice: updateBuyingPrice,
        sellingPrice: updateSellingPrice,
        total: totalPurchase,
    };
    const session = await mongoose_2.default.startSession();
    try {
        session.startTransaction();
        const updateVariant = await product_variant_schema_1.default.findOneAndUpdate({
            sellerId: sellerId,
            _id: new mongoose_1.Types.ObjectId(variantId),
        }, [
            {
                $set: {
                    stock: { $add: ["$stock", quantity] },
                    buyingPrice,
                    sellingPrice,
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
        const updateStockProduct = await product_schema_1.default.findOneAndUpdate({ sellerId: sellerId, _id: populatedProduct._id }, [
            {
                $set: {
                    stock: { $add: ["$stock", quantity] },
                    total_stock: { $add: ["$total_stock", quantity] },
                    display_price_max: {
                        $cond: {
                            if: {
                                $gte: ["$display_price_max", sellingPrice],
                            },
                            then: "$display_price_max",
                            else: sellingPrice,
                        },
                    },
                    display_price_min: {
                        $cond: {
                            if: { $lte: ["$display_price_min", sellingPrice] },
                            then: "$display_price_min",
                            else: sellingPrice,
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
                sellerId: sellerId,
                // vendorId: populatedProduct.vendorId,
                items: [item],
                productIds: [populatedProduct._id],
                itemCount: 1,
                totalAmount: totalPurchase,
                paidAmount: paidAmount,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
                note: note ?? "",
                createdBy: userId,
            },
        ], { session });
        if (!newPurchase) {
            throw new appError_1.AppError("Failed to create purchase");
        }
        const updateVendor = await vendor_schema_1.default.findOneAndUpdate({
            sellerId: sellerId,
            // _id: populatedProduct.vendorId,
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
//# sourceMappingURL=purchase.service.js.map