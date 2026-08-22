"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const customerSchema = new mongoose_1.Schema({
    sellerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Seller",
        required: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    addresses: [
        {
            // _id: false,
            // label: { type: String, default: "home" }, // "home", "office"
            // division: { type: String },
            // district: { type: String },
            // area: { type: String },
            // zip: { type: String },
            // isDefault: { type: Boolean, default: false },
            label: { type: String, required: true }, // "home", "office"
            district: { type: String, required: true },
            area: { type: String, required: true },
            zip: { type: String, default: null },
            isDefault: { type: Boolean, default: false },
        },
    ],
    image: { type: String, default: null },
    dob: { type: Date, default: null },
    gender: {
        type: String,
        enum: ["male", "female", "other", null],
        default: null,
    },
    totalPurchased: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    due: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    //CRM
    tags: { type: [String], default: [] },
    lastPurchasedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
});
customerSchema.index({ sellerId: 1, phone: 1 }, { unique: true });
customerSchema.index({ sellerId: 1, email: 1 }, {
    unique: true,
    partialFilterExpression: {
        email: { $type: "string" },
    },
});
customerSchema.index({ sellerId: 1, due: -1 }); // desending order due report
customerSchema.index({ sellerId: 1, lastPurchasedAt: -1 }); // recent customers
const Customer = (0, mongoose_1.model)("Customer", customerSchema);
exports.default = Customer;
//# sourceMappingURL=customer.schema.js.map