import { model, Schema } from "mongoose";
import { IPurchaseDocument } from "./purchase.interface";

const purchaseItemSchema = new Schema(
  {
    product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variant_id: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },

    // snapshots — frozen at purchase time
    product_name: { type: String, required: true },
    sku: { type: String, required: true },
    color: { type: String, default: null },
    size: { type: String, default: null },

    quantity: { type: Number, required: true, min: 1 },
    unit_price: { type: Number, required: true },
    selling_price: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false },
);

const PurchaseSchema = new Schema<IPurchaseDocument>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
    vendor_id: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    // ── Summary only ──────────────────────────────────────
    items: { type: [purchaseItemSchema], required: true },
    product_ids: [{ type: Schema.Types.ObjectId, ref: "Product" }], // unique products
    item_count: { type: Number, required: true },

    // financials
    total_amount: { type: Number, required: true, min: 0 },
    paid_amount: { type: Number, default: 0, min: 0 },
    due_amount: { type: Number, default: 0, min: 0 },

    status: {
      type: String,
      enum: ["pending", "partial", "paid"],
      default: "pending",
    },

    purchase_date: { type: Date, default: Date.now },
    note: { type: String, default: null, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

// ── Auto calculate due + payment status ──────────────────────────────────────
PurchaseSchema.pre("save", function () {
  this.due_amount = parseFloat(
    (this.total_amount - this.paid_amount).toFixed(2),
  );

  if (this.paid_amount <= 0) {
    this.status = "pending";
  } else if (this.paid_amount >= this.total_amount) {
    this.status = "paid";
    this.due_amount = 0;
  } else {
    this.status = "partial";
  }
});

// ── Indexes ───────────────────────────────────────────────────────────────────
PurchaseSchema.index({ sellerId: 1, createdAt: -1 });
PurchaseSchema.index({ sellerId: 1, vendor_id: 1, createdAt: -1 });
PurchaseSchema.index({ sellerId: 1, status: 1 });
PurchaseSchema.index({ vendor_id: 1, status: 1 });

const Purchase = model<IPurchaseDocument>("Purchase", PurchaseSchema);
export default Purchase;

// ─── company.schema.ts  (only the settings part — add to your existing schema) ─
//
//  Add this field inside your CompanySchema:
//
//  settings: {
//    auto_confirm_purchase: { type: Boolean, default: true },
//    // true  = stock updates instantly when PO is created (small/single-user company)
//    // false = stock updates only after warehouse staff confirms receipt
//  }
//
//  Example: when a company grows and hires warehouse staff:
//  PATCH /api/v1/companies/settings
//  { "auto_confirm_purchase": false }
