"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// staff.schema.ts
const mongoose_1 = require("mongoose");
const staffSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    sellerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Seller",
        required: true,
    },
    // ─── Basic Info ───────────────────────────────────────
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: null, trim: true },
    image: { type: String, default: null }, // Cloudinary URL
    // ─── HR Info ──────────────────────────────────────────
    designation: { type: String, default: null }, // "Manager", "Accountant"
    department: { type: String, default: null }, // "Inventory", "Sales"
    joining_date: { type: Date, default: null },
    salary: { type: Number, default: null },
    // ─── Identity ─────────────────────────────────────────
    nid: { type: String, default: null, select: false },
    nidImage: { type: String, default: null, select: false }, // Cloudinary URL
    // ─── Address ──────────────────────────────────────────
    address: { type: String, default: null },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
});
// ─── Indexes ──────────────────────────────────────────────
staffSchema.index({ sellerId: 1, userId: 1 }, { unique: true });
staffSchema.index({ sellerId: 1, phone: 1 }, { unique: true });
staffSchema.index({ sellerId: 1, email: 1 }, { unique: true, sparse: true });
const Staff = (0, mongoose_1.model)("Staff", staffSchema);
exports.default = Staff;
//# sourceMappingURL=staff.schema.js.map