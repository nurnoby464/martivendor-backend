import { Document, Types } from "mongoose";
import { TPaymentMethod } from "../../globalTypes/payment.types";
export type TPaymentRecordStatus = "pending" | "paid" | "failed" | "refunded" | "partially_refunded";
export interface IPayment {
    orderId: Types.ObjectId;
    customerId: Types.ObjectId;
    amount: number;
    method: TPaymentMethod;
    gateway: string | null;
    transactionId: string | null;
    status: TPaymentRecordStatus;
    refundedAmount: number;
    paidAt: Date | null;
    gatewayResponse?: unknown;
    createdAt: Date;
    updatedAt: Date;
}
export interface IPaymentDocument extends IPayment, Document {
}
//# sourceMappingURL=payment.validation.d.ts.map