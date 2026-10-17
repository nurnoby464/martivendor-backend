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
import SubOrder from "../../../CRM/subOrder/subOrder.schema";

export async function handleOrderCreated(payload: { orderId: Types.ObjectId }) {
  const { orderId } = payload;
  const order = await Order.findOne({
    _id: orderId,
    notificationSent: { $ne: true },
  }).lean();
  if (!order) return;

  console.log(`\n📧 Processing order.created event for #${order.orderNumber}`);

  const [customer, subOrders] = await Promise.all([
    Customer.findById(order.customerId).select("name email phone").lean(),
    SubOrder.find({
      orderId,
    })
      .sort({ subOrderNumber: 1 })
      .lean(),
  ]);

  if (!customer || subOrders.length === 0) {
    console.error(
      `❌ order.created: missing customer or sub-orders for ${order.orderNumber}`,
    );
    return; // log only. Never throw here: the order is already saved.
  }
  const sellerIds = subOrders.map((s) => s.sellerId);

  const sellers = await Seller.find({ _id: { $in: sellerIds } })
    .select("name userId")
    .populate("userId", "name email")
    .lean();

  const sellerMap = new Map(sellers.map((s) => [s._id.toString(), s]));
  const paymentNote =
    order.paymentMethod === "cash_on_delivery"
      ? "Cash on delivery"
      : `Online payment (${order.paymentStatus})`;
  const jobs: Promise<unknown>[] = [];

  // 1. one email to one customer , grouped by package
  if (customer.email) {
    jobs.push(
      sendEmail({
        to: customer.email,
        subject: `Order Confirmation - #${order.orderNumber}`,
        html: orderConfirmationTemplate(customer.name, {
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
      }),
    );
  }

  // 2. one email + one in-app notification and per seller
  for (const sub of subOrders) {
    const seller = sellerMap.get(sub.sellerId.toString());
    const owner = seller?.userId as unknown as
      | { name?: string; email?: string }
      | undefined;
    if (owner?.email) {
      jobs.push(
        sendEmail({
          to: owner.email,
          subject: `New Order - #${sub.subOrderNumber}`,
          html: sellerNotificationTemplate(
            owner.name || seller?.name || "Seller",
            {
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
            },
          ),
        }),
      );
    }
    jobs.push(
      notifySellerOwner(sub.sellerId, {
        type: NOTIFICATION_TYPES.ORDER.CREATED,
        title: "New Order",
        message: `Order #${sub.subOrderNumber} from ${customer.name}`,
        relatedId: order._id,
        relatedModel: "Order",
        data: {
          subOrderNumber: sub.subOrderNumber,
          total: sub.total,
          itemCount: sub.items.length,
        },
      }),
    );
  }

  // 3. Wait for all. One failure must not stop the others.

  const results = await Promise.allSettled(jobs);
  results.forEach((r) => {
    if (r.status === "rejected")
      console.error("❌ notification job failed:", r.reason);
    else if ((r.value as { success?: boolean })?.success === false)
      console.warn("⚠️ email failed:", (r.value as { error?: string }).error);
  });

  const allOk = results.every(
    (r) =>
      r.status === "fulfilled" &&
      (r.value as { success?: boolean })?.success !== false,
  );
  if (allOk) {
    await Order.updateOne(
      { _id: orderId },
      { $set: { notificationSent: true } },
    );
  }
}
