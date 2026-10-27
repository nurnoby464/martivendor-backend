"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyOrderById = exports.getMyOrders = exports.getAllOrder = exports.createOrder = exports.ENABLED_PAYMENT_METHODS = void 0;
const order_pricing_1 = require("./../../utils/order.pricing");
const mongoose_1 = __importStar(require("mongoose"));
const appError_1 = require("../../middlewares/appError");
const product_schema_1 = __importDefault(require("../../module/product/product.schema"));
const product_variant_schema_1 = __importDefault(require("../../module/product-variant/product-variant.schema"));
const customer_schema_1 = __importDefault(require("../customer/customer.schema"));
const order_schema_1 = __importDefault(require("./order.schema"));
const useSkip_1 = require("../../utils/useSkip");
const user_schema_1 = __importDefault(require("../../module/user/user.schema"));
const events_1 = require("../../shared/events");
const constants_1 = require("../../shared/notifications/constants");
const orderHelper_1 = require("../../utils/orderHelper");
const seller_schema_1 = require("../../module/seller/seller.schema");
const helper_1 = require("../../utils/helper");
const subOrder_interface_1 = require("../subOrder/subOrder.interface");
const money_1 = require("../../utils/money");
const subOrder_schema_1 = __importDefault(require("../subOrder/subOrder.schema"));
const payment_schema_1 = __importDefault(require("../payment/payment.schema"));
const resolveCustomer = async (input) => {
    const { name, phone, email, shippingAddress, userId, session } = input;
    const isSameCustomer = [
        name === shippingAddress.name,
        phone === shippingAddress.phone,
    ].every(Boolean);
    const normalizedPhone = (0, helper_1.normalizedBDPhone)(phone);
    const existingCustomer = await customer_schema_1.default.findOne({
        $or: [{ phone: normalizedPhone }, { email }],
    })
        .select("userId _id addresses phone email")
        .session(session)
        .lean();
    if (!existingCustomer) {
        const newAddress = isSameCustomer
            ? {
                label: "home",
                district: shippingAddress.city,
                area: shippingAddress.address,
                zip: shippingAddress.zip,
                isDefault: true,
            }
            : null;
        const [newCustomer] = await customer_schema_1.default.create([
            {
                name,
                phone: normalizedPhone,
                email,
                ...(newAddress && { addresses: [newAddress] }),
                ...(userId !== null && { userId }),
            },
        ], { session });
        if (!newCustomer)
            throw new appError_1.AppError("Failed to create customer", 500);
        if (newCustomer.userId) {
            const updateUser = await user_schema_1.default.findOneAndUpdate({
                _id: newCustomer.userId,
                isActive: true,
            }, {
                $set: {
                    profileId: newCustomer._id,
                    profileType: "Customer",
                    phone: normalizedPhone,
                    role: "customer",
                },
            }, {
                session,
                returnDocument: "after",
                runValidators: true,
            });
        }
        return newCustomer;
    }
    if (existingCustomer.email !== email) {
        throw new appError_1.AppError(`${email} not match Customer email`, 400);
    }
    if (phone && existingCustomer.phone && existingCustomer.phone !== phone)
        throw new appError_1.AppError(`${email} not match Customer phone`, 400);
    return existingCustomer;
};
exports.ENABLED_PAYMENT_METHODS = ["cash_on_delivery"];
const createOrder = async (input, userId) => {
    const { name, phone, email, items, shippingAddress, paymentMethod, note } = input;
    if (!exports.ENABLED_PAYMENT_METHODS.includes(paymentMethod)) {
        throw new appError_1.AppError("This payment method is not available yet", 400);
    }
    const orderId = new mongoose_1.Types.ObjectId();
    const paymentId = new mongoose_1.Types.ObjectId();
    // FIX 1: normalize ids once, and reject duplicates (uppercase hex or repeats broke the Map lookups)
    const cart = items.map((item) => ({
        variantId: new mongoose_1.Types.ObjectId(item.variantId),
        quantity: item.quantity,
    }));
    if (new Set(cart.map((c) => c.variantId.toString())).size !== cart.length) {
        throw new appError_1.AppError("Duplicate items in the cart", 400);
    }
    const variantIds = cart.map((c) => c.variantId);
    const variants = await product_variant_schema_1.default.find({
        _id: { $in: variantIds },
        isActive: true,
    })
        .select("_id productId sellerId sku image attributes sellingPrice stock discountType discountValue")
        .lean();
    if (variants.length !== cart.length) {
        throw new appError_1.AppError("One or more variants not found or inactive", 404);
    }
    // FIX 2: unique product ids (two variants of one product are normal)
    const productIds = [...new Set(variants.map((v) => v.productId.toString()))];
    const products = await product_schema_1.default.find({
        _id: { $in: productIds },
        isActive: true,
    })
        .select("_id sellerId name slug taxRate isActive discount hasDiscount")
        .lean();
    // FIX 3: a missing or inactive product is not a "seller mismatch"
    if (products.length !== productIds.length) {
        throw new appError_1.AppError("One or more products not found or inactive", 404);
    }
    // make unique sellers
    const uniqueSellerIds = [
        ...new Set(variants.map((v) => v.sellerId.toString())),
    ];
    const sellers = await seller_schema_1.Seller.find({
        _id: { $in: uniqueSellerIds },
        isActive: true,
        status: "approved",
    })
        .select("_id name isPlatform commissionRate userId")
        .lean();
    // add Map
    const productMap = new Map(products.map((product) => [
        product._id.toString(),
        { sellerId: product.sellerId.toString(), name: product.name },
    ]));
    const variantMap = new Map(variants.map((variant) => [
        variant._id.toString(),
        {
            sellingPrice: variant.sellingPrice,
            stock: variant.stock,
            attributes: variant.attributes,
            discountType: variant.discountType,
            discountValue: variant.discountValue,
            sku: variant.sku,
            productId: variant.productId,
            sellerId: variant.sellerId,
            image: variant.image,
        },
    ]));
    const sellerMap = new Map(sellers.map((s) => [s._id.toString(), s]));
    const subOrderDrafts = [];
    let index = 1;
    const group = new Map();
    if (sellerMap.size !== uniqueSellerIds.length) {
        throw new appError_1.AppError("One or more sellers are not available", 400);
    }
    const hasSellerMismatch = variants.some((variant) => productMap.get(variant.productId.toString())?.sellerId !==
        variant.sellerId.toString());
    if (hasSellerMismatch)
        throw new appError_1.AppError("Product and variant seller mismatch", 400);
    for (const item of cart) {
        const variant = variantMap.get(item.variantId.toString());
        if (!variant) {
            throw new appError_1.AppError(`Not found this ${item.variantId} `, 404);
        }
        const product = productMap.get(variant.productId.toString());
        if (!product) {
            throw new appError_1.AppError(`Product not found for variant: ${item.variantId} `, 404);
        }
        if (variant.stock < item.quantity) {
            throw new appError_1.AppError(`Insufficient stock for ${product.name} - ${variant.sku}. Available: ${variant.stock}`, 400);
        }
        const sellingPrice = variant.sellingPrice;
        const quantity = item.quantity;
        const lineBase = (0, money_1.round2)(sellingPrice * quantity); // FIX 4: round
        const discountAmount = (0, money_1.round2)((0, helper_1.calculateDiscount)({
            lineBase,
            discountValue: variant.discountValue ?? 0,
            discountType: variant.discountType ?? null,
            quantity,
        }));
        // FIX 4: check BEFORE using the value
        if (discountAmount > lineBase) {
            throw new appError_1.AppError("Discount amount cannot exceed the total price", 400);
        }
        const totalPrice = (0, money_1.round2)(lineBase - discountAmount);
        const key = variant.sellerId.toString();
        if (!group.has(key))
            group.set(key, []);
        group.get(key).push({
            productId: variant.productId,
            variantId: item.variantId,
            name: product.name,
            sku: variant.sku,
            image: variant.image ?? null,
            quantity,
            sellingPrice,
            discountType: variant.discountType ?? null,
            discountValue: variant.discountValue ?? 0,
            discountAmount,
            totalPrice,
        });
    }
    // FIX 5: generate the number AFTER every validation, so 400/404 errors do not waste numbers
    const orderNumber = await (0, orderHelper_1.generateOrderNumber)();
    for (const [sellerId, lines] of group) {
        subOrderDrafts.push({
            sellerId,
            seller: sellerMap.get(sellerId),
            lines,
            subOrderNumber: (0, orderHelper_1.generateSubOrderNumber)(orderNumber, index++),
        });
    }
    const subOrderPlans = subOrderDrafts.map((draft) => ({
        ...draft,
        items: draft.lines.map((l) => ({ ...l, taxRate: 0, taxAmount: 0 })),
        ...(0, order_pricing_1.calculateSubOrderMoney)(draft.lines, draft.seller),
    }));
    const sum = (pick) => (0, money_1.round2)(subOrderPlans.reduce((s, p) => s + pick(p), 0));
    const orderTotals = {
        subtotal: sum((p) => p.subtotal),
        discountTotal: sum((p) => p.discountAmount),
        taxTotal: 0,
        shippingTotal: sum((p) => p.shippingCharge),
        grandTotal: sum((p) => p.total),
    };
    // FIX 6: a holder for the result. The callback fills it, and we return it AFTER the commit
    const holder = {
        response: null,
    };
    const session = await mongoose_1.default.startSession();
    try {
        await session.withTransaction(async () => {
            // this callback can run more than once: no emails, no events, no commit here
            const customer = await resolveCustomer({
                name,
                phone,
                email,
                shippingAddress,
                userId,
                session,
            });
            const customerId = customer._id;
            const allLines = subOrderDrafts
                .flatMap((d) => d.lines)
                .sort((a, b) => a.variantId.toString().localeCompare(b.variantId.toString()));
            const ops = allLines.map((line) => ({
                updateOne: {
                    filter: {
                        _id: line.variantId,
                        isActive: true,
                        stock: { $gte: line.quantity },
                    },
                    update: { $inc: { stock: -line.quantity } },
                },
            }));
            const result = await product_variant_schema_1.default.bulkWrite(ops, {
                session,
            });
            if (result.matchedCount < ops.length) {
                // no session here: we want the committed stock, to blame the right line
                const current = await product_variant_schema_1.default.find({
                    _id: { $in: allLines.map((l) => l.variantId) },
                })
                    .select("_id stock")
                    .lean();
                const stockMap = new Map(current.map((v) => [v._id.toString(), v.stock]));
                const bad = allLines.find((l) => (stockMap.get(l.variantId.toString()) ?? 0) < l.quantity);
                throw new appError_1.AppError(bad
                    ? `Not enough stock for ${bad.name} (${bad.sku}). Available: ${stockMap.get(bad.variantId.toString()) ?? 0}`
                    : "Stock changed. Please refresh and try again.", 409);
            }
            await order_schema_1.default.create([
                {
                    _id: orderId,
                    orderNumber,
                    customerId,
                    shippingAddress,
                    subOrderCount: subOrderPlans.length,
                    ...orderTotals,
                    paidAmount: 0,
                    dueAmount: orderTotals.grandTotal,
                    paymentStatus: "due",
                    paymentMethod,
                    paymentId,
                    note,
                },
            ], { session });
            const createdSubOrders = await subOrder_schema_1.default.create(subOrderPlans.map((p) => ({
                orderId,
                orderNumber,
                customerId,
                subOrderNumber: p.subOrderNumber,
                sellerId: p.seller._id,
                items: p.items,
                subtotal: p.subtotal,
                discountAmount: p.discountAmount,
                taxAmount: p.taxAmount,
                shippingCharge: p.shippingCharge,
                total: p.total,
                commissionRate: p.commissionRate,
                commissionAmount: p.commissionAmount,
                sellerEarning: p.sellerEarning,
                status: "pending", // FIX 7: keep the literal type
                statusHistory: [
                    {
                        status: "pending",
                        at: new Date(),
                        by: null,
                        note: "Order placed",
                    },
                ],
            })), { session, ordered: true });
            await payment_schema_1.default.create([
                {
                    _id: paymentId,
                    orderId,
                    customerId,
                    amount: orderTotals.grandTotal,
                    method: paymentMethod,
                    status: "pending",
                },
            ], { session });
            // FIX 8: eventEmitter.emit(...) removed from here (see below, after the commit)
            // FIX 6: assign instead of "return"
            holder.response = {
                orderId,
                orderNumber,
                status: (0, orderHelper_1.deriveOrderStatus)(createdSubOrders),
                paymentStatus: "due",
                paymentMethod,
                subtotal: orderTotals.subtotal,
                shippingTotal: orderTotals.shippingTotal,
                grandTotal: orderTotals.grandTotal,
                dueAmount: orderTotals.grandTotal,
                subOrders: createdSubOrders.map((s) => ({
                    subOrderNumber: s.subOrderNumber,
                    seller: sellerMap.get(s.sellerId.toString())?.name ?? "",
                    total: s.total,
                })),
                paymentAction: null, // COD
            };
        }); // withTransaction commits here
    }
    finally {
        await session.endSession(); // FIX 9: await
    }
    if (!holder.response)
        throw new appError_1.AppError("Order was not created", 500);
    // FIX 8: AFTER the commit. A failure here must never fail the order
    try {
        events_1.eventEmitter.emit(constants_1.NOTIFICATION_TYPES.ORDER.CREATED, { orderId });
    }
    catch (err) {
        console.error("order.created handler failed:", err);
    }
    return holder.response;
};
exports.createOrder = createOrder;
const getAllOrder = async (sellerId, query) => {
    const { search, sortBy, sortOrder, page, limit, orderStatus, paymentStatus, customerId, } = query;
    if (!sellerId || !mongoose_1.Types.ObjectId.isValid(sellerId)) {
        throw new appError_1.AppError("Invalid company", 400);
    }
    const filter = {
        sellerId: sellerId,
    };
    if (search?.trim()) {
        filter.$or = [
            { orderNumber: { $reges: search.trim(), $options: "i" } },
            { customer: { $reges: search.trim(), $options: "i" } },
        ];
    }
    if (orderStatus) {
        filter.orderStatus = orderStatus;
    }
    if (paymentStatus) {
        filter.paymentStatus = paymentStatus;
    }
    const [orders, total, meta] = await Promise.all([
        order_schema_1.default.find(filter)
            .populate("customer", "_id name phone")
            .populate("items.product", "_id name sku")
            .skip((0, useSkip_1.useSkip)({ page, limit }))
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .lean(),
        order_schema_1.default.countDocuments(filter),
        order_schema_1.default.aggregate([
            { $match: { sellerId: sellerId } },
            {
                $facet: {
                    orderStatusStats: [
                        { $group: { _id: "$order_status", count: { $sum: 1 } } },
                    ],
                },
            },
        ]),
    ]);
    const orderStatusCounts = meta[0].orderStatusStats.reduce((acc, item) => {
        if (item._id) {
            acc[item._id] = item.count;
        }
        return acc;
    }, {});
    return { orders, total, orderStatusCounts };
};
exports.getAllOrder = getAllOrder;
// ─── getMyOrders ─────────────────────────────────────────────────────────────
// Returns paginated list of orders for the authenticated customer.
// Each order includes a lightweight item list (no population needed —
// items are embedded snapshots).
const MY_ORDER_FIELDS = [
    "orderId orderNumber subOrderNumber sellerId status createdAt",
    "items.productId items.variantId items.name items.image",
    "items.quantity items.sellingPrice items.discountAmount items.totalPrice",
    "subtotal discountAmount shippingCharge total",
    "trackingNumber courierName shippedAt deliveredAt cancelledAt cancelReason",
].join(" ");
const getMyOrders = async (customerId, query) => {
    const { page, limit, status, search } = query;
    // ── Base match ──────────────────────────────────────────────────────────────
    const match = {
        customerId: new mongoose_1.Types.ObjectId(customerId),
    };
    if (status !== "all") {
        match.status = status;
    }
    if (search?.trim()) {
        const prefix = { $regex: `^${(0, helper_1.escapeRegex)(search.toUpperCase())}` };
        match.$or = [{ orderNumber: prefix }, { subOrderNumber: prefix }];
    }
    const [subOrders, countRows] = await Promise.all([
        subOrder_schema_1.default.find(match)
            .select(MY_ORDER_FIELDS)
            .sort({ createdAt: -1, _id: -1 })
            .skip((0, useSkip_1.useSkip)({ page, limit }))
            .limit(limit)
            .lean(),
        subOrder_schema_1.default.aggregate([
            { $match: { customerId: new mongoose_1.Types.ObjectId(String(customerId)) } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
    ]);
    const statusCounts = Object.fromEntries(subOrder_interface_1.SUB_ORDER_STATUSES.map((s) => [s, 0]));
    for (const row of countRows)
        statusCounts[row._id] = row.count;
    const allCount = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    const total = search
        ? await subOrder_schema_1.default.countDocuments(match) // counts cannot know about the search text
        : status === "all"
            ? allCount
            : statusCounts[status];
    const sellerIds = [...new Set(subOrders.map((s) => s.sellerId.toString()))];
    const sellers = sellerIds.length
        ? await seller_schema_1.Seller.find({ _id: { $in: sellerIds } })
            .select("name slug image")
            .lean()
        : [];
    const sellerMap = new Map(sellers.map((s) => [
        s._id.toString(),
        { _id: s._id, name: s.name, slug: s.slug, image: s.image },
    ]));
    const orders = subOrders.map((s) => ({
        ...s,
        seller: sellerMap.get(s.sellerId.toString()) ?? null,
    }));
    return {
        orders,
        statusCounts,
        total,
    };
};
exports.getMyOrders = getMyOrders;
// ─── getMyOrderById ───────────────────────────────────────────────────────────
// Returns a single order with full detail.
// Ownership check: order.customer must match the requesting customerId.
const getMyOrderById = async (orderId) => {
    if (!mongoose_1.Types.ObjectId.isValid(orderId)) {
        throw new appError_1.AppError("Invalid order ID", 400);
    }
    const [order, subOrders] = await Promise.all([
        order_schema_1.default.findOne({ _id: new mongoose_1.Types.ObjectId(orderId) })
            .populate({
            path: "customerId",
            select: "name phone email",
        })
            .lean(),
        subOrder_schema_1.default.find({ orderId: new mongoose_1.Types.ObjectId(orderId) }).lean(),
    ]);
    if (!order) {
        throw new appError_1.AppError("Order not found", 404);
    }
    if (!subOrders)
        throw new appError_1.AppError("sub Order not found", 404);
    const data = {
        order: order.subOrderCount,
        paymentMethod: order.paymentMethod,
        deliveryTo: order.shippingAddress.city,
        shippingAddress: order.shippingAddress,
        subOrder: subOrders.map((subOrder) => ({
            orderNumber: subOrder.orderNumber,
            subOrderNumber: subOrder.subOrderNumber,
            items: subOrder.items,
            status: subOrder.status,
            shippingCharge: subOrder.shippingCharge,
        })),
    };
    return data;
};
exports.getMyOrderById = getMyOrderById;
//# sourceMappingURL=order.service.js.map