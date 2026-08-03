// staff.schema.ts
import { model, Schema } from "mongoose";
import { IStaffDocument } from "./staff.interface";

const staffSchema = new Schema<IStaffDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },

    // ─── Basic Info ───────────────────────────────────────
    name:   { type: String, required: true, trim: true },
    phone:  { type: String, required: true, trim: true },
    email:  { type: String, default: null,  trim: true },
    image: { type: String, default: null }, // Cloudinary URL

    // ─── HR Info ──────────────────────────────────────────
    designation:  { type: String, default: null }, // "Manager", "Accountant"
    department:   { type: String, default: null }, // "Inventory", "Sales"
    joining_date: { type: Date,   default: null },
    salary:       { type: Number, default: null },

    // ─── Identity ─────────────────────────────────────────
    nid: { type: String, default: null, select: false },
    nidImage:  { type: String, default: null, select: false }, // Cloudinary URL

    // ─── Address ──────────────────────────────────────────
    address: { type: String, default: null },

    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

// ─── Indexes ──────────────────────────────────────────────
staffSchema.index({ sellerId: 1, userId: 1 }, { unique: true });
staffSchema.index({ sellerId: 1, phone: 1 },  { unique: true });
staffSchema.index({ sellerId: 1, email: 1 },  { unique: true, sparse: true });

const Staff = model<IStaffDocument>("Staff", staffSchema);
export default Staff;