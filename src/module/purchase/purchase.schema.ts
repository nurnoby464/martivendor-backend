import { model, Schema } from "mongoose";
import { IPurchaseDocument } from "./purchase.interface";

const purchaseItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },

    // Snapshots — frozen at purchase time
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    color: { type: String, default: null },
    size: { type: String, default: null },

    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const PurchaseSchema = new Schema<IPurchaseDocument>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },

    // Summary
    items: { type: [purchaseItemSchema], required: true },
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }], // unique products
    itemCount: { type: Number, required: true },

    // Financials
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    dueAmount: { type: Number, default: 0, min: 0 },

    status: {
      type: String,
      enum: ["pending", "partial", "paid"],
      default: "pending",
    },

    purchaseDate: { type: Date, default: Date.now },
    note: { type: String, default: null, trim: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Auto calculate due + payment status
PurchaseSchema.pre("save", function () {
  this.dueAmount = parseFloat(
    (this.totalAmount - this.paidAmount).toFixed(2)
  );

  if (this.paidAmount <= 0) {
    this.status = "pending";
  } else if (this.paidAmount >= this.totalAmount) {
    this.status = "paid";
    this.dueAmount = 0;
  } else {
    this.status = "partial";
  }
});

// Indexes
PurchaseSchema.index({ sellerId: 1, createdAt: -1 });
PurchaseSchema.index({ sellerId: 1, vendorId: 1, createdAt: -1 });
PurchaseSchema.index({ sellerId: 1, status: 1 });
PurchaseSchema.index({ vendorId: 1, status: 1 });

const Purchase = model<IPurchaseDocument>("Purchase", PurchaseSchema);

export default Purchase;