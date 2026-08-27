import { sendEmail } from "../../../config/mail";
import { orderConfirmationTemplate } from "../../../templates/orderConfirmation";
import { NOTIFICATION_TYPES } from "../../notifications/constants";
import * as NotificationServices from "../../../CRM/notification/notification.service";
import Order from "../../../CRM/order/order.schema";
import { sellerNotificationTemplate } from "../../../templates/sellerNotification";
import { IOrderDocument } from "../../../CRM/order/order.interface";
import { Types } from "mongoose";
import Customer from "../../../CRM/customer/customer.schema";
import { AppError } from "../../../middlewares/appError";
import { Seller } from "../../../module/seller/seller.schema";
import { notifySellerOwner } from "../../../utils/notificationRecipients";

export async function handleOrderCreated(payload: {
  order: IOrderDocument;
  customerId: Types.ObjectId;
  sellerId: Types.ObjectId;
}) {
  const { order, customerId, sellerId } = payload;

  console.log(`\n📧 Processing order.created event for #${order.orderNumber}`);

  // ✅ CHECK GUARD FLAG FIRST
  if (order.notificationSent === true) {
    console.log(`⏭️  Notifications already sent, skipping...`);
    return; // Exit early, don't send again
  }

  const [customer, seller] = await Promise.all([
    Customer.findOne({
      sellerId,
      _id: customerId,
      isActive: true,
    })
      .select("name email")
      .lean(),
    Seller.findOne({
      _id: sellerId,
      isActive: true,
    })
      .populate("userId", "name email")
      .lean(),
  ]);
  console.log(customer);
  if (!customer || !customer.email) {
    throw new AppError("Customer not found or email missing", 404);
  }

  if (!seller || !seller.userId) {
    throw new AppError("Seller not found", 404);
  }

  const sellerEmail = (seller.userId as any)?.email;
  const sellerName = (seller.userId as any)?.name || seller.name;
  if (!sellerEmail) {
    throw new AppError("Seller email not found", 404);
  }

  try {
    // 1. Send customer confirmation email
    console.log(`   → Sending confirmation email to ${customer.email}`);
    const customerEmailResult = await sendEmail({
      to: customer.email,
      subject: `Order Confirmation - Order #${order.orderNumber}`,
      html: orderConfirmationTemplate(customer.name, order),
    });

    if (!customerEmailResult.success) {
      console.warn(
        `   ⚠️  Customer email failed: ${customerEmailResult.error}`,
      );
    }

    // 2. Send seller notification email
    console.log(`   → Sending notification email to seller ${sellerEmail}`);
    const sellerEmailResult = await sendEmail({
      to: sellerEmail,
      subject: `🎉 New Order Received - Order #${order.orderNumber}`,
      html: sellerNotificationTemplate(sellerName, {
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
    await notifySellerOwner(seller._id, {
      type: NOTIFICATION_TYPES.ORDER.CREATED,
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
    await Order.updateOne({ _id: order._id }, { notificationSent: true });

    console.log(`✅ Order notifications processed for #${order.orderNumber}\n`);
  } catch (error) {
    console.error(`❌ Error handling order.created:`, error);
  }
}
