"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const sellerCustomerSchema = new mongoose_1.Schema({
    sellerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Seller", required: true },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    source: { type: String, enum: ["online", "pos"], default: "online" },
    totalOrders: { type: Number, default: 0 },
    totalPurchased: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    due: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
    lastPurchasedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
// the same customer can't be added twice to the same seller
sellerCustomerSchema.index({ sellerId: 1, customerId: 1 }, { unique: true });
sellerCustomerSchema.index({ sellerId: 1, phone: 1 });
sellerCustomerSchema.index({ sellerId: 1, due: -1 }); // due report
sellerCustomerSchema.index({ sellerId: 1, lastPurchasedAt: -1 }); // recent customers
const SellerCustomer = (0, mongoose_1.model)("SellerCustomer", sellerCustomerSchema);
exports.default = SellerCustomer;
//# sourceMappingURL=sellerCustomer.schema.js.map