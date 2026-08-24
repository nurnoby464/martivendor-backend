import { sendEmail } from "../../../config/mail";
import { orderConfirmationTemplate } from "../../../templates/orderConfirmation";
import { NOTIFICATION_TYPES } from "../../notifications/constants";
import * as NotificationServices from "../../../CRM/notification/notification.service"
import Order from "../../../CRM/order/order.schema";
import { sellerNotificationTemplate } from "../../../templates/sellerNotification";

export async function handleOrderCreated(payload: {
  order: any;
  customer: any;
  seller: any;
}) {
  const { order, customer, seller } = payload;

  console.log(
    `\n📧 Processing order.created event for #${order.orderNumber}`
  );

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
        `   ⚠️  Customer email failed: ${customerEmailResult.error}`
      );
    }

    // 2. Send seller notification email
    console.log(`   → Sending notification email to seller ${seller.email}`);
    const sellerEmailResult = await sendEmail({
      to: seller.email,
      subject: `🎉 New Order Received - Order #${order.orderNumber}`,
      html: sellerNotificationTemplate(seller.name, {
        orderNumber: order.orderNumber,
        customerName: customer.name,
        customerPhone: customer.phone,
        itemCount: order.items.length,
        totalAmount: order.grandTotal,
        paymentStatus: order.paymentStatus,
      }),
    });

    if (!sellerEmailResult.success) {
      console.warn(`   ⚠️  Seller email failed: ${sellerEmailResult.error}`);
    }

    // 3. Create in-app notification for seller (using function)
    console.log(
      `   → Creating in-app notification for seller ${seller._id}`
    );
    await NotificationServices.create({
      userId: seller._id,
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

    // 4. Mark as processed
    await Order.updateOne(
      { _id: order._id },
      { notificationSent: true }
    );

    console.log(
      `✅ Order notifications processed for #${order.orderNumber}\n`
    );
  } catch (error) {
    console.error(`❌ Error handling order.created:`, error);
  }
}