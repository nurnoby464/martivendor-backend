"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleOrderCreated = handleOrderCreated;
const mail_1 = require("../../../config/mail");
const orderConfirmation_1 = require("../../../templates/orderConfirmation");
const constants_1 = require("../../notifications/constants");
const order_schema_1 = __importDefault(require("../../../CRM/order/order.schema"));
const sellerNotification_1 = require("../../../templates/sellerNotification");
const customer_schema_1 = __importDefault(require("../../../CRM/customer/customer.schema"));
const seller_schema_1 = require("../../../module/seller/seller.schema");
const notificationRecipients_1 = require("../../../utils/notificationRecipients");
const subOrder_schema_1 = __importDefault(require("../../../CRM/subOrder/subOrder.schema"));
async function handleOrderCreated(payload) {
    const { orderId } = payload;
    const order = await order_schema_1.default.findOne({
        _id: orderId,
        notificationSent: { $ne: true },
    }).lean();
    if (!order)
        return;
    console.log(`\n📧 Processing order.created event for #${order.orderNumber}`);
    const [customer, subOrders] = await Promise.all([
        customer_schema_1.default.findById(order.customerId).select("name email phone").lean(),
        subOrder_schema_1.default.find({
            orderId,
        })
            .sort({ subOrderNumber: 1 })
            .lean(),
    ]);
    if (!customer || subOrders.length === 0) {
        console.error(`❌ order.created: missing customer or sub-orders for ${order.orderNumber}`);
        return; // log only. Never throw here: the order is already saved.
    }
    const sellerIds = subOrders.map((s) => s.sellerId);
    const sellers = await seller_schema_1.Seller.find({ _id: { $in: sellerIds } })
        .select("name userId")
        .populate("userId", "name email")
        .lean();
    const sellerMap = new Map(sellers.map((s) => [s._id.toString(), s]));
    const paymentNote = order.paymentMethod === "cash_on_delivery"
        ? "Cash on delivery"
        : `Online payment (${order.paymentStatus})`;
    const jobs = [];
    // 1. one email to one customer , grouped by package
    if (customer.email) {
        jobs.push((0, mail_1.sendEmail)({
            to: customer.email,
            subject: `Order Confirmation - #${order.orderNumber}`,
            html: (0, orderConfirmation_1.orderConfirmationTemplate)(customer.name, {
                orderNumber: order.orderNumber,
                createdAt: order.createdAt,
                shippingAddress: order.shippingAddress,
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
                subtotal: order.subtotal,
                discountTotal: order.discountTotal,
                shippingTotal: order.shippingTotal,
                grandTotal: order.grandTotal,
                dueAmount: order.dueAmount,
                packages: subOrders.map((s) => ({
                    subOrderNumber: s.subOrderNumber,
                    sellerName: sellerMap.get(s.sellerId.toString())?.name ?? "Seller",
                    items: s.items.map((i) => ({
                        name: i.name,
                        quantity: i.quantity,
                        sellingPrice: i.sellingPrice,
                        totalPrice: i.totalPrice,
                    })),
                    shippingCharge: s.shippingCharge,
                    total: s.total,
                })),
            }),
        }));
    }
    // 2. one email + one in-app notification and per seller
    for (const sub of subOrders) {
        const seller = sellerMap.get(sub.sellerId.toString());
        const owner = seller?.userId;
        if (owner?.email) {
            jobs.push((0, mail_1.sendEmail)({
                to: owner.email,
                subject: `New Order - #${sub.subOrderNumber}`,
                html: (0, sellerNotification_1.sellerNotificationTemplate)(owner.name || seller?.name || "Seller", {
                    subOrderNumber: sub.subOrderNumber,
                    customerName: customer.name,
                    customerPhone: order.shippingAddress.phone,
                    items: sub.items.map((i) => ({
                        name: i.name,
                        sku: i.sku,
                        quantity: i.quantity,
                        totalPrice: i.totalPrice,
                    })),
                    subtotal: sub.subtotal,
                    shippingCharge: sub.shippingCharge,
                    total: sub.total,
                    paymentNote,
                }),
            }));
        }
        jobs.push((0, notificationRecipients_1.notifySellerOwner)(sub.sellerId, {
            type: constants_1.NOTIFICATION_TYPES.ORDER.CREATED,
            title: "New Order",
            message: `Order #${sub.subOrderNumber} from ${customer.name}`,
            relatedId: order._id,
            relatedModel: "Order",
            data: {
                subOrderNumber: sub.subOrderNumber,
                total: sub.total,
                itemCount: sub.items.length,
            },
        }));
    }
    // 3. Wait for all. One failure must not stop the others.
    const results = await Promise.allSettled(jobs);
    results.forEach((r) => {
        if (r.status === "rejected")
            console.error("❌ notification job failed:", r.reason);
        else if (r.value?.success === false)
            console.warn("⚠️ email failed:", r.value.error);
    });
    const allOk = results.every((r) => r.status === "fulfilled" &&
        r.value?.success !== false);
    if (allOk) {
        await order_schema_1.default.updateOne({ _id: orderId }, { $set: { notificationSent: true } });
    }
}
//# sourceMappingURL=orderListeners.js.map