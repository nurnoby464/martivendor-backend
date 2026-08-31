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
const appError_1 = require("../../../middlewares/appError");
const seller_schema_1 = require("../../../module/seller/seller.schema");
const notificationRecipients_1 = require("../../../utils/notificationRecipients");
async function handleOrderCreated(payload) {
    const { order, customerId, sellerId } = payload;
    console.log(`\n📧 Processing order.created event for #${order.orderNumber}`);
    // ✅ CHECK GUARD FLAG FIRST
    if (order.notificationSent === true) {
        console.log(`⏭️  Notifications already sent, skipping...`);
        return; // Exit early, don't send again
    }
    const [customer, seller] = await Promise.all([
        customer_schema_1.default.findOne({
            sellerId,
            _id: customerId,
            isActive: true,
        })
            .select("name email")
            .lean(),
        seller_schema_1.Seller.findOne({
            _id: sellerId,
            isActive: true,
        })
            .populate("userId", "name email")
            .lean(),
    ]);
    console.log(customer);
    if (!customer || !customer.email) {
        throw new appError_1.AppError("Customer not found or email missing", 404);
    }
    if (!seller || !seller.userId) {
        throw new appError_1.AppError("Seller not found", 404);
    }
    const sellerEmail = seller.userId?.email;
    const sellerName = seller.userId?.name || seller.name;
    if (!sellerEmail) {
        throw new appError_1.AppError("Seller email not found", 404);
    }
    try {
        // 1. Send customer confirmation email
        console.log(`   → Sending confirmation email to ${customer.email}`);
        const customerEmailResult = await (0, mail_1.sendEmail)({
            to: customer.email,
            subject: `Order Confirmation - Order #${order.orderNumber}`,
            html: (0, orderConfirmation_1.orderConfirmationTemplate)(customer.name, order),
        });
        if (!customerEmailResult.success) {
            console.warn(`   ⚠️  Customer email failed: ${customerEmailResult.error}`);
        }
        // 2. Send seller notification email
        console.log(`   → Sending notification email to seller ${sellerEmail}`);
        const sellerEmailResult = await (0, mail_1.sendEmail)({
            to: sellerEmail,
            subject: `🎉 New Order Received - Order #${order.orderNumber}`,
            html: (0, sellerNotification_1.sellerNotificationTemplate)(sellerName, {
                orderNumber: order.orderNumber,
                customerName: customer.name,
                customerPhone: customer.phone || "N/A",
                itemCount: order.items.length,
                totalAmount: order.grandTotal,
                paymentStatus: order.paymentStatus,
            }),
        });
        if (!sellerEmailResult.success) {
            console.warn(`   ⚠️  Seller email failed: ${sellerEmailResult.error}`);
        }
        // 3. Create in-app notification for seller (using function)
        console.log(`   → Creating in-app notification for seller ${seller._id}`);
        await (0, notificationRecipients_1.notifySellerOwner)(seller._id, {
            type: constants_1.NOTIFICATION_TYPES.ORDER.CREATED,
            title: "New Order",
            message: `Order #${order.orderNumber} from ${customer.name}`,
            relatedId: order._id,
            relatedModel: "Order",
            data: {
                orderNumber: order.orderNumber,
                customerName: customer.name,
                customerPhone: customer.phone,
                itemCount: order.items.length,
                totalAmount: order.grandTotal,
                paymentStatus: order.paymentStatus,
            },
        });
        // await notifySellerStaff(seller._id, "manage_orders", {
        //   type: NOTIFICATION_TYPES.ORDER.CREATED,
        //   title: "New Order",
        //   message: `Order #${order.orderNumber} from ${customer.name}`,
        //   relatedId: order._id,
        //   relatedModel: "Order",
        // });
        // 4. Mark as processed
        await order_schema_1.default.updateOne({ _id: order._id }, { notificationSent: true });
        console.log(`✅ Order notifications processed for #${order.orderNumber}\n`);
    }
    catch (error) {
        console.error(`❌ Error handling order.created:`, error);
    }
}
//# sourceMappingURL=orderListeners.js.map