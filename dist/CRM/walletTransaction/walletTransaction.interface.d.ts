import { Document, Types } from "mongoose";
export type TWalletTxnType = "sale_earning" | "refund_reversal" | "payout" | "adjustment";
export interface IWalletTransaction {
    sellerId: Types.ObjectId;
    subOrderId: Types.ObjectId | null;
    orderId: Types.ObjectId | null;
    type: TWalletTxnType;
    amount: number;
    note: string | null;
    createdBy: Types.ObjectId | null;
    createdAt: Date;
}
export interface IWalletTransactionDocument extends IWalletTransaction, Document {
}
//# sourceMappingURL=walletTransaction.interface.d.ts.map