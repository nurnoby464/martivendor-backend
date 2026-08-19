import { model, Schema } from "mongoose";
import {
  ICustomerSnapshot,
  ISale,
  ISaleDocument,
  ISaleItem,
} from "./posSell.interface";

const saleItemSchema = new Schema<ISaleItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variantId: {
    type: Schema.Types.ObjectId,
    ref: "ProductVariant",
    required: true,
  },
  productName: { type: String, required: true },
  attributes: [{ key: String, value: String }],
  sku: { type: String, required: true },
  image: { type: String, default: null },
  quantity: { type: Number, required: true, min: [1, "Minimum order one"] },
  unitPrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  discountType: { type: String, enum: ["flat", "percentage"], default: null },
  discountValue: { type: Number, default: 0 },
  discount_amount: { type: Number, default: 0 },
  subtotal: { type: Number, required: true },
});

const customerSnapshotsSchema = new Schema<ICustomerSnapshot>({
  name: { type: String, required: true },
  phone: { type: String },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: "Customer",
    default: null,
  },
});

const saleSchema = new Schema<ISaleDocument>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    saleCode: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: customerSnapshotsSchema,
      default: null,
    },
    items: {
      type: [saleItemSchema],
      required: true,
      validate: {
        validator: (v: ISaleItem[]) => v.length > 0,
        message: "Sale must have at least one item",
      },
    },

    grossAmount: { type: Number, required: true },
    discountTotal: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    changeAmount: { type: Number, default: 0 },

    paymentMethod: {
      type: String,
      enum: ["cash", "card", "mobile_banking", "credit"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "partial", "due"],
      default: "due",
    },

    creditUsed: { type: Number, default: 0 },
    saleDate: { type: Date, default: Date.now },
    note: { type: String, default: null },

    status: {
      type: String,
      enum: ["completed", "returned", "cancelled"],
      default: "completed",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    createdByType: {
      type: String,
      enum: ["staff", "system"],
      default: "staff",
    },
  },
  { timestamps: true },
);
saleSchema.index({ sellerId: 1, saleDate: -1 });
saleSchema.index({ sellerId: 1, paymentStatus: 1 });
saleSchema.index({ sellerId: 1, status: 1 });

const PosSale = model<ISaleDocument>("PosSale", saleSchema);
export default PosSale;
