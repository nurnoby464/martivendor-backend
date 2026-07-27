"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellerStaff = void 0;
const mongoose_1 = require("mongoose");
const sellerStaffSchema = new mongoose_1.Schema({
    sellerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true, trim: true },
    department: {
        type: String,
        enum: ["product_management", "order_fulfillment", "customer_support", "accounts"],
        required: true,
        index: true,
    },
    designation: { type: String, default: null },
    permissions: [
        {
            type: String,
            enum: [
                "manage_products",
                "manage_inventory",
                "manage_orders",
                "view_orders",
                "manage_customer_chat",
                "manage_reviews",
                "view_payout",
                "request_payout",
            ],
        },
    ],
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    invitedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
sellerStaffSchema.index({ sellerId: 1, status: 1 });
sellerStaffSchema.index({ sellerId: 1, department: 1 });
exports.SellerStaff = (0, mongoose_1.model)("SellerStaff", sellerStaffSchema);
//# sourceMappingURL=staff.schema.js.map