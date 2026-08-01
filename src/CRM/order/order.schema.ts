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
    total_price: { type: Number, required: true },
  },
  { _id: false }, // no need separate _id for embedded items
);

const shippingAddressSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: null },
    address: { type: String, required: true },
    city: { type: String, required: true },
    zip: { type: String, default: null },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrderDocument>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
    order_number: { type: String, required: true },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    items: { type: [orderItemSchema], required: true },
    shipping_address: { type: shippingAddressSchema, required: true },

    subtotal: { type: Number, required: true },
    discount_amount: { type: Number, default: 0 },
    tax_amount: { type: Number, default: 0 },
    shipping_charge: { type: Number, default: 0 },
    grand_total: { type: Number, required: true },

    paid_amount: { type: Number, default: 0 },
    due_amount: { type: Number, required: true },

    payment_status: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
    },
    payment_method: {
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
    order_status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },

    note: { type: String, default: null },
  },
  { timestamps: true },
);

// indexes
orderSchema.index({ sellerId: 1, order_number: 1 }, { unique: true });
orderSchema.index({ sellerId: 1, customer_id: 1 });
orderSchema.index({ sellerId: 1, order_status: 1 });
orderSchema.index({ sellerId: 1, payment_status: 1 });
orderSchema.index({ sellerId: 1, createdAt: -1 }); // recent orders list

const Order = model<IOrderDocument>("Order", orderSchema);
export default Order;
