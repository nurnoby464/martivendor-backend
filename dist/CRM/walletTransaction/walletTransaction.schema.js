"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const walletTransactionSchema = new mongoose_1.Schema({
    sellerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Seller", required: true },
    subOrderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "SubOrder",
        default: null,
    },
    orderId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Order", default: null },
    type: {
        type: String,
        enum: ["sale_earning", "refund_reversal", "payout", "adjustment"],
        required: true,
    },
    amount: { type: Number, required: true },
    note: { type: String, default: null },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });
walletTransactionSchema.index({ sellerId: 1, createdAt: -1 });
// Idempotency: a SubOrder can be credited to the seller ONLY ONCE,
// even if the payout cron job runs twice or crashes halfway.
walletTransactionSchema.index({ subOrderId: 1, type: 1 }, {
    unique: true,
    partialFilterExpression: { type: "sale_earning" },
});
const WalletTransaction = (0, mongoose_1.model)("WalletTransaction", walletTransactionSchema);
exports.default = WalletTransaction;
//# sourceMappingURL=walletTransaction.schema.js.map