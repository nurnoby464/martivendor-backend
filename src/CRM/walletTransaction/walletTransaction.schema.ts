import { model, Schema } from "mongoose";
import { IWalletTransactionDocument } from "./walletTransaction.interface";

const walletTransactionSchema = new Schema<IWalletTransactionDocument>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
    subOrderId: {
      type: Schema.Types.ObjectId,
      ref: "SubOrder",
      default: null,
    },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", default: null },
    type: {
      type: String,
      enum: ["sale_earning", "refund_reversal", "payout", "adjustment"],
      required: true,
    },
    amount: { type: Number, required: true },
    note: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

walletTransactionSchema.index({ sellerId: 1, createdAt: -1 });

// Idempotency: a SubOrder can be credited to the seller ONLY ONCE,
// even if the payout cron job runs twice or crashes halfway.
walletTransactionSchema.index(
  { subOrderId: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "sale_earning" },
  },
);

const WalletTransaction = model<IWalletTransactionDocument>(
  "WalletTransaction",
  walletTransactionSchema,
);
export default WalletTransaction;