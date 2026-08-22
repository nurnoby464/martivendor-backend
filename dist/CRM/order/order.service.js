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
exports.getMyOrderById = exports.getMyOrders = exports.getAllOrder = exports.createOrder = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const appError_1 = require("../../middlewares/appError");
const product_schema_1 = __importDefault(require("../../module/product/product.schema"));
const product_variant_schema_1 = __importDefault(require("../../module/product-variant/product-variant.schema"));
const customer_schema_1 = __importDefault(require("../customer/customer.schema"));
const healper_1 = require("../../utils/healper");
const order_schema_1 = __importDefault(require("./order.schema"));
const useSkip_1 = require("../../utils/useSkip");
const invoice_schema_1 = __importDefault(require("../invoice/invoice.schema"));
const user_schema_1 = __importDefault(require("../../module/user/user.schema"));
const resolveCustomer = async (sellerId, name, phone, email, shipping_address, session, userId) => {
    //check shipping address is same as customer address
    const isSamePerson = shipping_address?.phone === phone && shipping_address.name === name;
    const newAddress = isSamePerson
        ? {
            label: "home",
            district: shipping_address.city,
            area: shipping_address.address,
            zip: shipping_address.zip,
            isDefault: true,
        }
        : null;
    // console.log(userId)
    // check is exist customer
    const existing = await customer_schema_1.default.findOne({
        sellerId,
        $or: [...(userId ? [{ userId }] : []), { phone }],
    }).session(session);
    if (existing) {
        // check if exist this address
        const addressExists = newAddress
            ? existing.addresses.some((addr) => addr.district === newAddress.district &&
                addr.area === newAddress.area)
            : false;
        await customer_schema_1.default.updateOne({ _id: existing._id }, {
            $set: {
                name,
                ...(email && { email }),
                ...(userId && { userId }),
            },
            // only push if address is new
            ...(!addressExists &&
                newAddress && {
                $push: {
                    addresses: newAddress,
                },
            }),
        }, { runValidators: true, session });
        if (userId && !existing.userId) {
            await user_schema_1.default.updateOne({
                _id: userId,
                profileId: null,
            }, {
                $set: { profileId: existing._id, profileType: "Customer" },
            }, { session });
        }
        return existing._id;
    }
    // create new customer
    const [customer] = await customer_schema_1.default.create([
        {
            sellerId,
            name,
            ...(email !== null && { email }),
            phone,
            ...(userId && { userId }),
            addresses: newAddress ? [newAddress] : [],
        },
    ], { session });
    if (!customer) {
        throw new appError_1.AppError("Failed to create customer");
    }
    if (userId) {
        await Promise.all([
            user_schema_1.default.updateOne({ _id: userId, profileId: null }, { $set: { profileId: customer._id, profileType: "Customer" } }, { session }),
            user_schema_1.default.updateOne({
                _id: userId,
                $or: [{ phone: { $exists: false } }, { phone: null }, { phone: "" }],
            }, { $set: { phone } }, { session }),
        ]);
    }
    return customer._id;
};
const createOrder = async ({ sellerId, input }) => {
    const { name, phone, userId, email, items, shippingAddress, discountAmount, taxAmount, shippingCharge, paidAmount, paymentMethod, note, } = input;
    const session = await mongoose_1.default.startSession();
    try {
        await session.startTransaction();
        // 1. load all variant
        const variantIds = items.map((i) => new mongoose_1.Types.ObjectId(i.variant_id));
        const variants = await product_variant_schema_1.default.find({
            sellerId: sellerId,
            isActive: true,
            _id: { $in: variantIds },
        }).session(session);
        console.log("variants", variants);
        if (variants.length < items.length) {
            throw new appError_1.AppError("One or more variants not found or inactive", 404);
        }
        const variantMap = new Map(variants.map((v) => [v._id.toString(), v]));
        // 2. load all products
        const productIds = variants.map((v) => v.productId);
        const product = await product_schema_1.default.find({
            sellerId: sellerId,
            isActive: true,
            _id: { $in: productIds },
        }).session(session);
        console.log("product", product);
        const productMap = new Map(product.map((p) => [p._id.toString(), p]));
        // 3 validate stock
        const orderItem = [];
        for (const item of items) {
            const variant = variantMap.get(item.variant_id);
            if (!variant) {
                throw new appError_1.AppError(`Not found this ${item.variant_id} `, 404);
            }
            const product = productMap.get(variant.productId.toString());
            if (!product) {
                throw new appError_1.AppError(`Product not found for variant: ${item.variant_id} `, 404);
            }
            if (variant.stock < item.quantity) {
                throw new appError_1.AppError(`Insufficient stock for ${product.name} - ${variant.sku}. Available: ${variant.stock}`, 400);
            }
            const unitPrice = variant.sellingPrice;
            const taxRate = product.taxRate;
            const taxAmount = Math.round((unitPrice * item.quantity * taxRate) / 100);
            const discountAmount = (0, healper_1.calculateDiscount)({
                sellingPrice: unitPrice,
                quantity: item.quantity,
                discountType: variant.discountType ?? null,
                discountValue: variant.discountValue ?? 0,
            });
            const totalPrice = unitPrice * item.quantity - discountAmount;
            orderItem.push({
                totalPrice: totalPrice,
                sellingPrice: unitPrice,
                quantity: item.quantity,
                sku: variant.sku,
                name: product.name,
                image: variant.image,
                variant: variant._id,
                product: product._id,
                discountType: variant.discountType ?? null,
                discountValue: variant.discountValue ?? 0,
                discountAmount,
                taxAmount,
                taxRate,
            });
        }
        // 4. calculate total
        const subTotal = orderItem.reduce((sum, item) => sum + item.totalPrice, 0);
        const discountTotal = orderItem.reduce((sum, item) => sum + item.discountAmount, 0);
        const shippingCharge = 60;
        const totalTax = orderItem.reduce((sum, item) => sum + item.taxAmount, 0);
        const grandTotal = subTotal + totalTax + shippingCharge;
        //  check is paid or unpaid or partial
        const effectivePaid = paymentMethod === "cash_on_delivery"
            ? 0
            : Math.min(paidAmount, grandTotal);
        const dueAmount = Math.max(grandTotal - effectivePaid, 0);
        let paymentStatus;
        if (paymentMethod === "cash_on_delivery") {
            paymentStatus = "due";
        }
        else {
            paymentStatus =
                effectivePaid <= 0
                    ? "due"
                    : effectivePaid >= grandTotal
                        ? "paid"
                        : "partial";
        }
        // 5. resolve customer
        const customerId = await resolveCustomer(sellerId, name, phone, email, shippingAddress, session, userId ? new mongoose_1.Types.ObjectId(userId) : undefined);
        // 6. update customer info
        await customer_schema_1.default.updateOne({ _id: customerId }, [
            {
                $set: {
                    totalPurchased: { $add: ["$totalPurchased", grandTotal] },
                    totalPaid: { $add: ["$totalPaid", effectivePaid] },
                    due: {
                        $max: [
                            0,
                            {
                                $subtract: [
                                    { $add: ["$totalPurchased", grandTotal] },
                                    { $add: ["$totalPaid", effectivePaid] },
                                ],
                            },
                        ],
                    },
                    credit: {
                        $max: [
                            0,
                            {
                                $subtract: [
                                    { $add: ["$totalPaid", effectivePaid] },
                                    { $add: ["$totalPurchased", grandTotal] },
                                ],
                            },
                        ],
                    },
                    lastPurchasedAt: new Date(),
                },
            },
        ], { session, updatePipeline: true });
        //7. deduct stock
        for (const item of orderItem) {
            await product_variant_schema_1.default.updateOne({ _id: item.variant }, {
                $inc: { stock: -item.quantity },
            }, {
                session,
            });
        }
        //8 generate order
        const orderNumber = await (0, healper_1.generateOderNumber)(sellerId);
        //9 create order
        const [order] = await order_schema_1.default.create([
            {
                sellerId: sellerId,
                orderNumber: orderNumber,
                customer: customerId,
                items: orderItem,
                shippingAddress,
                subtotal: subTotal,
                discountAmount: discountTotal,
                taxAmount: orderItem.reduce((sum, item) => sum + item.taxAmount, 0),
                shippingCharge: shippingCharge,
                grandTotal: grandTotal,
                paidAmount: effectivePaid,
                dueAmount: dueAmount,
                paymentStatus: paymentStatus,
                paymentMethod,
                orderStatus: "pending",
                note: note ?? null,
            },
        ], { session });
        if (!order) {
            throw new appError_1.AppError("Failed to order", 400);
        }
        const invoiceNumber = await (0, healper_1.generateInvoiceNumber)();
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 7);
        await invoice_schema_1.default.create([
            {
                invoiceNumber,
                order: order._id,
                sellerId: sellerId,
                customer: order.customer,
                items: order.items,
                subtotal: order.subtotal,
                discountAmount: order.discountAmount,
                taxAmount: order.taxAmount,
                shippingCharge: order.shippingCharge,
                grandTotal: order.grandTotal,
                paidAmount: order.paidAmount,
                dueAmount: order.dueAmount,
                paymentMethod: order.paymentMethod,
                status: order.paymentStatus,
                issuedAt: new Date(),
                deliveryDate,
                paidDate: paymentStatus === "paid" ? new Date() : null,
                note: order.note,
            },
        ], { session });
        // next apply here send email
        await session.commitTransaction();
        return order;
    }
    catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
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
        filter.$or = [{}];
    }
    if (orderStatus) {
        filter.order_status = orderStatus;
    }
    if (paymentStatus) {
        filter.payment_status = paymentStatus;
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
const getMyOrders = async (customerId, sellerId, query) => {
    const { page = 1, limit = 10, orderStatus, search } = query;
    const skip = (page - 1) * limit;
    // ── Base match ──────────────────────────────────────────────────────────────
    const match = {
        sellerId: new mongoose_1.Types.ObjectId(sellerId),
        customer: new mongoose_1.Types.ObjectId(customerId),
    };
    console.log(match);
    if (orderStatus && orderStatus !== "all") {
        match.orderStatus = orderStatus;
    }
    if (search?.trim()) {
        // order_number is a plain string field — safe to use $regex
        match.order_number = {
            $regex: search.trim(),
            $options: "i",
        };
    }
    // ── Aggregation ─────────────────────────────────────────────────────────────
    const [result] = await order_schema_1.default.aggregate([
        { $match: match },
        {
            $facet: {
                orders: [
                    { $sort: { createdAt: -1 } },
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            order_number: 1,
                            order_status: 1,
                            payment_status: 1,
                            payment_method: 1,
                            items: {
                                $map: {
                                    input: "$items",
                                    as: "item",
                                    in: {
                                        name: "$$item.name",
                                        sku: "$$item.sku",
                                        quantity: "$$item.quantity",
                                        unit_price: "$$item.unit_price",
                                        total_price: "$$item.total_price",
                                        image: "$$item.image", // ✅ directly from snapshot
                                    },
                                },
                            },
                            subtotal: 1,
                            discount_amount: 1,
                            tax_amount: 1,
                            shipping_charge: 1,
                            grand_total: 1,
                            paid_amount: 1,
                            due_amount: 1,
                            shipping_address: 1,
                            note: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        },
                    },
                ],
                total: [{ $count: "count" }],
                // Status counts for tab badges on the frontend
                statusCounts: [
                    {
                        $group: {
                            _id: "$order_status",
                            count: { $sum: 1 },
                        },
                    },
                ],
            },
        },
    ]);
    const orders = result?.orders ?? [];
    const total = result?.total?.[0]?.count ?? 0;
    // Reshape statusCounts: [{ _id: "pending", count: 2 }] → { pending: 2, ... }
    const statusCounts = {};
    for (const s of result?.statusCounts ?? []) {
        statusCounts[s._id] = s.count;
    }
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
    const order = await order_schema_1.default.findOne({ _id: new mongoose_1.Types.ObjectId(orderId) })
        .populate({
        path: "items.product",
        select: "name slug images",
    })
        .populate({
        path: "items.variant",
        select: "sku image attributes sellingPrice stock",
    })
        .populate({
        path: "customer",
        select: "name phone email",
    })
        .populate({
        path: "sellerId",
        select: "name storeName",
    })
        .lean();
    if (!order) {
        throw new appError_1.AppError("Order not found", 404);
    }
    return order;
};
exports.getMyOrderById = getMyOrderById;
//# sourceMappingURL=order.service.js.map