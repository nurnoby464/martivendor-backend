"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const payment_types_1 = require("../../globalTypes/payment.types");
const paymentSchema = new mongoose_1.Schema({
    orderId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Order", required: true },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    method: {
        type: String,
        enum: payment_types_1.PAYMENT_METHODS,
        required: true,
    },
    gateway: { type: String, default: null },
    transactionId: { type: String, default: null },
    status: {
        type: String,
        enum: payment_types_1.PAYMENT_RECORD_STATUSES,
        default: "pending",
    },
    refundedAmount: { type: Number, default: 0, min: 0 },
    paidAt: { type: Date, default: null },
    gatewayResponse: { type: mongoose_1.Schema.Types.Mixed, select: false },
}, { timestamps: true });
paymentSchema.index({ orderId: 1 });
// the same gateway transaction can never be recorded twice
// (protects against webhook retries / double click)
paymentSchema.index({ transactionId: 1 }, { unique: true, partialFilterExpression: { transactionId: { $type: "string" } } });
const Payment = (0, mongoose_1.model)("Payment", paymentSchema);
exports.default = Payment;
//# sourceMappingURL=payment.schema.js.map