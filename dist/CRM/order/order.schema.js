"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// order.model.ts
const mongoose_1 = require("mongoose");
const payment_types_1 = require("../../globalTypes/payment.types");
const shippingAddressSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    zip: { type: String, default: null },
}, { _id: false });
const orderItemSchema = new mongoose_1.Schema({
    product: { type: mongoose_1.Schema.Types.ObjectId, ref: "Product", required: true },
    variant: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "ProductVariant",
        required: true,
    },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    image: { type: String, default: null },
    quantity: { type: Number, required: true, min: 1 },
    sellingPrice: { type: Number, required: true },
    discountType: {
        type: String,
        enum: ["flat", "percentage", null],
        default: null,
    },
    discountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
}, { _id: false });
const orderSchema = new mongoose_1.Schema({
    orderNumber: { type: String, required: true },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
    },
    shippingAddress: { type: shippingAddressSchema, required: true },
    subOrderCount: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
    discountTotal: { type: Number, default: 0, min: 0 },
    taxTotal: { type: Number, default: 0, min: 0 },
    shippingTotal: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    dueAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
        type: String,
        enum: payment_types_1.PAYMENT_STATUSES,
        default: "due",
    },
    paymentMethod: {
        type: String,
        enum: [...payment_types_1.PAYMENT_METHODS, null],
        default: null,
    },
    paymentId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Payment", default: null },
    note: { type: String, default: null },
    notificationSent: { type: Boolean, default: false },
}, { timestamps: true });
orderSchema.index({ customerId: 1, createdAt: -1 }); // "My Orders"
orderSchema.index({ createdAt: -1 }); // admin list
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ notificationSent: 1 });
const Order = (0, mongoose_1.model)("Order", orderSchema);
exports.default = Order;
//# sourceMappingURL=order.schema.js.map