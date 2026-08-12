"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Seller = void 0;
const mongoose_1 = require("mongoose");
const sellerSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    isPlatform: { type: Boolean, default: false },
    name: { type: String, required: true, trim: true },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    image: { type: String, default: null },
    banner: { type: String, default: null },
    description: { type: String, default: null },
    kyc: {
        nidNumber: { type: String, default: null },
        nidFrontImage: { type: String, default: null },
        nidBackImage: { type: String, default: null },
        tradeLicenseNumber: { type: String, default: null },
        tradeLicenseImage: { type: String, default: null },
        tinNumber: { type: String, default: null },
        status: {
            type: String,
            enum: ["not_submitted", "pending", "verified", "rejected"],
            default: "not_submitted",
        },
        rejectionReason: { type: String, default: null },
    },
    payout: {
        preferredMethod: {
            type: String,
            enum: ["bank", "bkash", "nagad", "rocket"],
            default: null,
        },
        bank: {
            type: new mongoose_1.Schema({
                accountName: String,
                accountNumber: String,
                bankName: String,
                branchName: String,
                routingNumber: { type: String, default: null },
            }, { _id: false }),
            default: null,
        },
        mobileBanking: {
            type: new mongoose_1.Schema({
                provider: { type: String, enum: ["bkash", "nagad", "rocket"] },
                accountNumber: String,
            }, { _id: false }),
            default: null,
        },
    },
    commissionRate: { type: Number, required: true, default: 10 },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "suspended"],
        default: "pending",
        index: true,
    },
    rejectionReason: { type: String, default: null },
    approvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
    rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
    },
    totalSales: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    walletBalance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
sellerSchema.index({ status: 1, isPlatform: 1 });
// partial unique index: enforces at most ONE isPlatform:true doc,
// without restricting how many isPlatform:false (vendor) docs exist
sellerSchema.index({ isPlatform: 1 }, { unique: true, partialFilterExpression: { isPlatform: true } });
sellerSchema.pre("save", function () {
    if (this.isPlatform) {
        this.commissionRate = 0; // platform doesn't charge itself commission
        this.status = "approved"; // platform seller skips the approval workflow
    }
});
exports.Seller = (0, mongoose_1.model)("Seller", sellerSchema);
//# sourceMappingURL=seller.schema.js.map