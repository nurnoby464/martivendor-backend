// ─── vendor.interface.ts ──────────────────────────────────────────────────────

// ─── vendor.schema.ts ─────────────────────────────────────────────────────────

import { Schema, model } from "mongoose";
import { IVendorDocument } from "./vendor.interface";

// ── Counter for vendor_code sequence per company ──────────────────────────────
const VendorCounterSchema = new Schema(
  {
    sellerId: { type: Schema.Types.ObjectId, required: true },
    seq: { type: Number, default: 0 },
  },
  { collection: "vendor_counters" },
);
VendorCounterSchema.index({ sellerId: 1 }, { unique: true });
export const VendorCounter = model("VendorCounter", VendorCounterSchema);

// ── Note sub-schema ───────────────────────────────────────────────────────────
const VendorNoteSchema = new Schema(
  {
    text: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

// ── Vendor schema ─────────────────────────────────────────────────────────────
const VendorSchema = new Schema<IVendorDocument>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: [true, "sellerId is required"],
      index: true,
    },

    vendor_code: {
      type: String,
      uppercase: true,
      trim: true,
      // not required here — filled by pre-save hook
    },

    name: {
      type: String,
      required: [true, "Vendor name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [200, "Name cannot exceed 200 characters"],
    },

    phone: { type: String, required: [true, "Phone is required"], trim: true },
    email: { type: String, default: null, lowercase: true, trim: true },
    address: { type: String, default: null, trim: true },
    notes: { type: [VendorNoteSchema], default: [] },

    // financials
    total_payable: { type: Number, default: 0, min: 0 },
    total_paid: { type: Number, default: 0, min: 0 },
    due: { type: Number, default: 0, min: 0 },

    is_active: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

// ── Auto-generate vendor_code on first save ───────────────────────────────────
VendorSchema.pre("save", async function () {
  if (!this.isNew) return;

  const counter = await VendorCounter.findOneAndUpdate(
    { sellerId: this.sellerId },
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  );

  this.vendor_code = `VND-${String(counter.seq).padStart(5, "0")}`;
  // e.g. VND-00001, VND-00002 ...
});

// ── Indexes ───────────────────────────────────────────────────────────────────
VendorSchema.index({ sellerId: 1, vendor_code: 1 }, { unique: true });
VendorSchema.index({ sellerId: 1, is_active: 1 });
VendorSchema.index({ sellerId: 1, name: 1 });
VendorSchema.index({ sellerId: 1, due: -1 });

const Vendor = model<IVendorDocument>("Vendor", VendorSchema);
export default Vendor;
