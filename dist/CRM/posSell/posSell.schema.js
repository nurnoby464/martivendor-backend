"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const saleItemSchema = new mongoose_1.Schema({
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    variantId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "ProductVariant",
        required: true,
    },
    productName: { type: String, required: true },
    attributes: [{ key: String, value: String }],
    sku: { type: String, required: true },
    image: { type: String, default: null },
    quantity: { type: Number, required: true, min: [1, "Minimum order one"] },
    buyingPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    discountType: { type: String, enum: ["flat", "percentage"], default: null },
    discountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    lineTotal: { type: Number, required: true },
});
const customerSnapshotsSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    phone: { type: String },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Customer",
        default: null,
    },
});
const saleSchema = new mongoose_1.Schema({
    sellerId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
            validator: (v) => v.length > 0,
            message: "Sale must have at least one item",
        },
    },
    grossAmount: { type: Number, required: true },
    posDiscountType: {
        type: String,
        enum: ["flat", "percentage"],
        default: null,
    },
    posDiscountValue: { type: Number, default: 0 },
    posDiscountAmount: { type: Number, default: 0 },
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: false,
    },
    createdByType: {
        type: String,
        enum: ["staff", "system"],
        default: "staff",
    },
}, { timestamps: true });
saleSchema.index({ sellerId: 1, saleDate: -1 });
saleSchema.index({ sellerId: 1, paymentStatus: 1 });
saleSchema.index({ sellerId: 1, status: 1 });
const PosSale = (0, mongoose_1.model)("PosSale", saleSchema);
exports.default = PosSale;
//# sourceMappingURL=posSell.schema.js.map