"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Otp = void 0;
const mongoose_1 = require("mongoose");
const otpSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
    },
    otp: {
        type: String,
        required: true,
        match: /^\d{6}$/,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
}, {
    timestamps: true,
    versionKey: false,
});
// Automatically delete the document 1 minute after creation
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.Otp = (0, mongoose_1.model)("Otp", otpSchema);
//# sourceMappingURL=seller.opt.schema.js.map