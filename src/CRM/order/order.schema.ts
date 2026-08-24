// order.model.ts
import { model, Schema } from "mongoose";
import { IOrderDocument, IOrderItem } from "./order.interface";

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variant: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    image: { type: String, default: null },
    quantity: { type: Number, required: true, min: 1 },
    sellingPrice: { type: Number, required: true },
    discountType: {
      type: String,
      enum: ["flat", "percentage", null],
      default: null,
    },
    discountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
  },
  { _id: false },
);

const shippingAddressSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    zip: { type: String, default: null },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrderDocument>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
    orderNumber: { type: String, required: true },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    items: { type: [orderItemSchema], required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },

    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },

    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, required: true },

    paymentStatus: {
      type: String,
      enum: ["due", "partial", "paid"],
      default: "due",
    },
    paymentMethod: {
      type: String,
      enum: [
        "cash",
        "cash_on_delivery",
        "card",
        "mobile_banking",
        "credit",
        "online",
      ],
      default: null,
    },
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },

    note: { type: String, default: null },
    notificationSent: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true },
);

orderSchema.index({ sellerId: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ sellerId: 1, orderStatus: 1 });
orderSchema.index({ sellerId: 1, paymentStatus: 1 });
orderSchema.index({ sellerId: 1, createdAt: -1 });

const Order = model<IOrderDocument>("Order", orderSchema);
export default Order;
