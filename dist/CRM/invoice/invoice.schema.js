"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// const companySnapshotSchema = new Schema<ICompanySnapshot>(
//   {
//     name: { type: String, required: true },
//     phone: { type: String, required: true },
//     email: { type: String, required: true },
//     address: { type: String, required: true },
//     logo: { type: String, default: null },
//   },
//   { _id: false },
// );
const invoiceItemSchema = new mongoose_1.Schema({
    product: { type: mongoose_1.Schema.Types.ObjectId, ref: "Product", required: true },
    variant: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "ProductVariant",
        required: true,
    },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    buyingPrice: { type: Number, required: true },
    total_price: { type: Number, required: true },
}, { _id: false });
const invoiceSchema = new mongoose_1.Schema({
    invoiceNumber: { type: String, required: true },
    order: { type: mongoose_1.Schema.Types.ObjectId, ref: "Order", required: true },
    sellerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Seller", required: true },
    // company: { type: companySnapshotSchema, required: true },
    customer: { type: mongoose_1.Schema.Types.ObjectId, ref: "Customer", required: true },
    items: { type: [invoiceItemSchema], required: true },
    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, required: true },
    paymentMethod: {
        type: String,
        enum: [
            "cash",
            "cash_on_delivery",
            "card",
            "mobile_banking",
            "credit",
            "online",
        ],
        default: null,
    },
    status: {
        type: String,
        enum: ["unpaid", "partial", "paid", "cancelled"],
        default: "unpaid",
    },
    issuedAt: { type: Date, required: true },
    deliveryDate: { type: Date, default: null },
    paidDate: { type: Date, default: null },
    note: { type: String, default: null },
}, { timestamps: true });
// indexes
invoiceSchema.index({ companyId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ companyId: 1, order: 1 }, { unique: true });
invoiceSchema.index({ companyId: 1, customer: 1 });
invoiceSchema.index({ companyId: 1, status: 1 });
invoiceSchema.index({ companyId: 1, createdAt: -1 });
const Invoice = (0, mongoose_1.model)("Invoice", invoiceSchema);
exports.default = Invoice;
//# sourceMappingURL=invoice.schema.js.map