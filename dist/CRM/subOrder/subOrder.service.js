"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSellerOrderById = exports.getSellerOrders = void 0;
const mongoose_1 = require("mongoose");
const customer_schema_1 = __importDefault(require("../customer/customer.schema"));
const helper_1 = require("../../utils/helper");
const useSkip_1 = require("../../utils/useSkip");
const subOrder_schema_1 = __importDefault(require("./subOrder.schema"));
const order_schema_1 = __importDefault(require("../order/order.schema"));
const subOrder_interface_1 = require("./subOrder.interface");
const appError_1 = require("../../middlewares/appError");
const dhakaStart = (day) => new Date(`${day}T00:00:00.000+06:00`);
const dhakaEnd = (day) => new Date(`${day}T23:59:59.999+06:00`);
const looksLikePhone = (v) => /^[\d+\s()-]{7,}$/.test(v);
const getSellerOrders = async (sellerId, query) => {
    const { page, limit, status, payoutStatus, search, dateFrom, dateTo, minTotal, maxTotal, sortBy, sortOrder, } = query;
    const match = { sellerId };
    if (status?.length) {
        match.status = status.length === 1 ? status[0] : { $in: status };
    }
    if (payoutStatus)
        match.payoutStatus = payoutStatus;
    if (dateFrom || dateTo) {
        match.createdAt = {
            ...(dateFrom && { $gte: dhakaStart(dateFrom) }),
            ...(dateTo && { $lte: dhakaEnd(dateTo) }),
        };
    }
    if (search) {
        if (looksLikePhone(search)) {
            const customer = await customer_schema_1.default.findOne({
                phone: (0, helper_1.normalizedBDPhone)(search),
            })
                .select("_id")
                .lean();
            match.customerId = { $in: customer ? [customer._id] : [] };
        }
        else {
            const rx = new RegExp(`^${(0, helper_1.escapeRegex)(search.toUpperCase())}`);
            match.$or = [{ orderNumber: rx }, { subOrderNumber: rx }];
        }
    }
    const pipeline = [
        { $match: match },
        { $sort: { [sortBy]: sortOrder, _id: sortOrder } }, // _id = stable tie-breaker
        { $skip: (0, useSkip_1.useSkip)({ page, limit }) },
        { $limit: limit },
        {
            $project: {
                orderId: 1,
                orderNumber: 1,
                subOrderNumber: 1,
                status: 1,
                payoutStatus: 1,
                subtotal: 1,
                discountAmount: 1,
                shippingCharge: 1,
                total: 1,
                commissionRate: 1,
                commissionAmount: 1,
                sellerEarning: 1,
                trackingNumber: 1,
                courierName: 1,
                shippedAt: 1,
                deliveredAt: 1,
                createdAt: 1,
                itemCount: { $size: "$items" },
                totalQuantity: { $sum: "$items.quantity" },
                items: {
                    $map: {
                        input: { $slice: ["$items", 3] },
                        as: "i",
                        in: {
                            name: "$$i.name",
                            sku: "$$i.sku",
                            image: "$$i.image",
                            quantity: "$$i.quantity",
                        },
                    },
                },
            },
        },
    ];
    const [rows, total, statusAgg] = await Promise.all([
        subOrder_schema_1.default.aggregate(pipeline),
        subOrder_schema_1.default.countDocuments(match),
        subOrder_schema_1.default.aggregate([
            { $match: { sellerId } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
    ]);
    const orderIds = [...new Set(rows.map((r) => r.orderId.toString()))].map((id) => new mongoose_1.Types.ObjectId(id));
    const parents = orderIds.length
        ? await order_schema_1.default.find({ _id: { $in: orderIds } })
            .select("shippingAddress paymentMethod paymentStatus note")
            .lean()
        : [];
    const parentMap = new Map(parents.map((o) => [o._id.toString(), o]));
    const orders = rows.map((r) => {
        const parent = parentMap.get(r.orderId.toString());
        return {
            ...r,
            customer: parent
                ? {
                    name: parent.shippingAddress.name,
                    phone: parent.shippingAddress.phone,
                }
                : null,
            shippingAddress: parent
                ? {
                    address: parent.shippingAddress.address,
                    city: parent.shippingAddress.city,
                    zip: parent.shippingAddress.zip,
                }
                : null,
            payment: parent
                ? {
                    method: parent.paymentMethod,
                    // NOTE: order-level status (covers all sellers' packages), not per package
                    orderPaymentStatus: parent.paymentStatus,
                }
                : null,
            note: parent?.note ?? null,
        };
    });
    const statusCounts = { all: 0 };
    subOrder_interface_1.SUB_ORDER_STATUSES.forEach((s) => (statusCounts[s] = 0));
    for (const { _id, count } of statusAgg) {
        statusCounts[_id] = count;
        statusCounts.all = (statusCounts.all ?? 0) + count;
    }
    return { orders, total, statusCounts };
};
exports.getSellerOrders = getSellerOrders;
const getSellerOrderById = async (orderId, sellerId) => {
    const sub = await subOrder_schema_1.default.findOne({
        orderId: new mongoose_1.Types.ObjectId(orderId),
        sellerId,
    }).lean();
    if (!sub)
        throw new appError_1.AppError("Order not found", 404);
    const [order, customer] = await Promise.all([
        order_schema_1.default.findById(sub.orderId)
            .select("orderNumber createdAt shippingAddress paymentMethod paymentStatus note")
            .lean(),
        customer_schema_1.default.findById(sub.customerId).select("name phone").lean(),
    ]);
    if (!order)
        throw new appError_1.AppError("Order not found", 404);
    const isCOD = order.paymentMethod === "cash_on_delivery";
    return {
        orderId: order._id,
        orderNumber: order.orderNumber,
        subOrderId: sub._id,
        subOrderNumber: sub.subOrderNumber,
        createdAt: order.createdAt,
        status: sub.status,
        statusHistory: sub.statusHistory,
        customer: {
            name: customer?.name,
            phone: customer?.phone ?? order.shippingAddress.phone,
        },
        shippingAddress: order.shippingAddress,
        note: order.note,
        payment: {
            method: order.paymentMethod,
            cashToCollect: isCOD ? sub.total : 0,
        },
        items: sub.items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            name: i.name,
            sku: i.sku,
            image: i.image,
            quantity: i.quantity,
            sellingPrice: i.sellingPrice,
            discountAmount: i.discountAmount,
            totalPrice: i.totalPrice,
        })),
        totals: {
            subtotal: sub.subtotal,
            discountAmount: sub.discountAmount,
            shippingCharge: sub.shippingCharge,
            total: sub.total,
        },
        earnings: {
            commissionRate: sub.commissionRate,
            commissionAmount: sub.commissionAmount,
            sellerEarning: sub.sellerEarning,
            payoutStatus: sub.payoutStatus,
            payoutReleaseAt: sub.payoutReleaseAt,
        },
        shipping: {
            trackingNumber: sub.trackingNumber,
            courierName: sub.courierName,
            shippedAt: sub.shippedAt,
            deliveredAt: sub.deliveredAt,
            cancelledAt: sub.cancelledAt,
            cancelReason: sub.cancelReason,
        },
    };
};
exports.getSellerOrderById = getSellerOrderById;
//# sourceMappingURL=subOrder.service.js.map