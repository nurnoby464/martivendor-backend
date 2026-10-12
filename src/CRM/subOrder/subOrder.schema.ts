import { model, Schema } from "mongoose";
import {
  IStatusHistory,
  ISubOrderDocument,
  ISubOrderItem,
  SUB_ORDER_STATUSES,
} from "./subOrder.interface";
import { isClose } from "../../utils/money";

const subOrderItemSchema = new Schema<ISubOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    image: { type: String, default: null },
    quantity: { type: Number, required: true, min: 1 },
    sellingPrice: { type: Number, required: true, min: 0 },
    discountType: {
      type: String,
      enum: ["flat", "percentage", null],
      default: null,
    },
    discountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
  },
  //   { _id: false },
);

const statusHistorySchema = new Schema<IStatusHistory>(
  {
    status: { type: String, enum: SUB_ORDER_STATUSES, required: true },
    at: { type: Date, default: Date.now },
    by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    note: { type: String, default: null },
  },
  //   { _id: false },
);

const subOrderSchema = new Schema<ISubOrderDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    orderNumber: { type: String, required: true },
    subOrderNumber: { type: String, required: true, unique: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    items: {
      type: [subOrderItemSchema],
      required: true,
      validate: {
        validator: (v: unknown[]) => v.length > 0,
        message: "SubOrder must have at least one item",
      },
    },

    subtotal: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    shippingCharge: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },

    commissionRate: { type: Number, required: true, min: 0, max: 100 },
    commissionAmount: { type: Number, required: true, min: 0 },
    sellerEarning: { type: Number, required: true, min: 0 },

    status: { type: String, enum: SUB_ORDER_STATUSES, default: "pending" },
    statusHistory: { type: [statusHistorySchema], default: [] },

    trackingNumber: { type: String, default: null },
    courierName: { type: String, default: null },
    shippedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: null },

    payoutStatus: {
      type: String,
      enum: ["held", "released", "paid", "reversed"],
      default: "held",
    },
    payoutReleaseAt: { type: Date, default: null },
  },
  { timestamps: true },
);

subOrderSchema.pre("validate", function () {
  const itemsSum = this.items.reduce((s, i) => s + i.totalPrice, 0);
  if (!isClose(this.subtotal, itemsSum)) {
    throw new Error("SubOrder subtotal does not match items");
  }
  if (
    !isClose(this.total, this.subtotal + this.taxAmount + this.shippingCharge)
  ) {
    throw new Error("SubOrder total does not match its parts");
  }
  if (!isClose(this.sellerEarning, this.total - this.commissionAmount)) {
    throw new Error("SubOrder sellerEarning does not match commission");
  }
});

subOrderSchema.index({ orderId: 1 }); // customer order detail
subOrderSchema.index({ sellerId: 1, createdAt: -1 }); // seller order list
subOrderSchema.index({ sellerId: 1, status: 1, createdAt: -1 }); // seller tabs
subOrderSchema.index({ sellerId: 1, orderNumber: 1 }); // seller search
subOrderSchema.index({ customerId: 1, createdAt: -1 });
subOrderSchema.index({ payoutStatus: 1, payoutReleaseAt: 1 }); // payout cron job

const SubOrder = model<ISubOrderDocument>("SubOrder", subOrderSchema);
export default SubOrder;
