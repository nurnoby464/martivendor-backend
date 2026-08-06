"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionParamsSchema = exports.updatePasswordSchema = exports.loginSchema = void 0;
const mongoose_1 = require("mongoose");
const zod_1 = __importDefault(require("zod"));
const SessionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "userId is required"],
    },
    valid: {
        type: Boolean,
        default: true,
    },
    user_agent: {
        type: String,
        default: null,
        trim: true,
    },
    ip: {
        type: String,
        default: null,
        trim: true,
    },
}, {
    timestamps: true,
});
// ─── Indexes ─────────────────────────────────────────────
SessionSchema.index({ userId: 1, valid: 1 }); // fast lookup: active sessions for a user
SessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 }); // TTL — auto-delete after 30 days
const Session = (0, mongoose_1.model)("Session", SessionSchema);
exports.default = Session;
exports.loginSchema = zod_1.default.object({
    email: zod_1.default.email("Give a valid email").trim().toLowerCase(),
    password: zod_1.default
        .string({ error: "Password is required" })
        .min(8, "Password must be at least 8 characters"),
});
exports.updatePasswordSchema = zod_1.default.object({
    oldPassword: zod_1.default
        .string({ error: "Password is required" })
        .min(8, "Password must be at least 8 characters"),
    newPassword: zod_1.default
        .string({ error: "Password is required" })
        .min(8, "Password must be at least 8 characters")
    // .regex(
    //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    //   "Password must contain uppercase, lowercase, number and special character",
    // ),
});
const objectIdSchema = zod_1.default
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid id format");
exports.sessionParamsSchema = zod_1.default.object({
    userId: objectIdSchema,
    sessionId: objectIdSchema,
});
//# sourceMappingURL=auth.schema.js.map