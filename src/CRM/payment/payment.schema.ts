import { model, Schema } from "mongoose";
import { IPaymentDocument } from "./payment.interface";
import { PAYMENT_METHODS, PAYMENT_RECORD_STATUSES } from "../../globalTypes/payment.types";

const paymentSchema = new Schema<IPaymentDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum:PAYMENT_METHODS,
      required: true,
    },
    gateway: { type: String, default: null },
    transactionId: { type: String, default: null },
    status: {
      type: String,
      enum: PAYMENT_RECORD_STATUSES,
      default: "pending",
    },
    refundedAmount: { type: Number, default: 0, min: 0 },
    paidAt: { type: Date, default: null },
    gatewayResponse: { type: Schema.Types.Mixed, select: false },
  },
  { timestamps: true },
);

paymentSchema.index({ orderId: 1 });
// the same gateway transaction can never be recorded twice
// (protects against webhook retries / double click)
paymentSchema.index(
  { transactionId: 1 },
  { unique: true, partialFilterExpression: { transactionId: { $type: "string" } } },
);

const Payment = model<IPaymentDocument>("Payment", paymentSchema);
export default Payment;