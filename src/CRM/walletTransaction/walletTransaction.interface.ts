import { Document, Types } from "mongoose";

// sale_earning    : + sellerEarning (when SubOrder is delivered & payout released)
// refund_reversal : - money taken back after a return/refund
// payout          : - money sent to seller's bank/bkash
// adjustment      : +/- manual correction by super_admin (must have a note)
export type TWalletTxnType =
  | "sale_earning"
  | "refund_reversal"
  | "payout"
  | "adjustment";

// Ledger = append only. Never edit or delete a row; add a correcting row.
// Seller balance = SUM(amount) of its rows.
export interface IWalletTransaction {
  sellerId: Types.ObjectId;
  subOrderId: Types.ObjectId | null;
  orderId: Types.ObjectId | null;
  type: TWalletTxnType;
  amount: number; // positive = credit, negative = debit
  note: string | null;
  createdBy: Types.ObjectId | null; // null = system
  createdAt: Date;
}

export interface IWalletTransactionDocument
  extends IWalletTransaction,
    Document {}