"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const user_interface_1 = require("./user.interface");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_schema_1 = __importDefault(require("../auth/auth.schema"));
const UserSchema = new mongoose_1.Schema({
    name: {
        type: String,
        trim: true,
        required: true,
        minlength: [2, "Name must be at least 2 characters"],
        maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    phone: {
        type: String,
        // default: null,
        trim: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "Password must be at least 8 characters"],
        select: false,
    },
    passwordChangedAt: {
        type: Date,
        default: null,
        select: false,
    },
    role: {
        type: String,
        required: [true, "Role is required"],
        enum: {
            values: user_interface_1.USER_ROLES, // ✅ runtime array
            message: "Invalid role: {VALUE}",
        },
    },
    sellerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Seller",
        default: null,
        // null for super_admin | set for admin and all role users
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    emailVerified: {
        type: Boolean,
        default: false,
    },
    // Add these
    profileId: {
        type: mongoose_1.Schema.Types.ObjectId,
        refPath: "profileType",
        default: null,
    },
    profileType: {
        type: String,
        enum: user_interface_1.PROFILE_TYPE,
        default: null,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    lastLogin: { type: Date, default: null },
    resetToken: { type: String, default: null, select: false },
    resetTokenExp: { type: Date, default: null, select: false },
}, {
    timestamps: true,
});
// ─── Indexes ─────────────────────────────────────────────
UserSchema.index({ sellerId: 1, role: 1 });
UserSchema.index({ createdBy: 1 });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { phone: { $type: "string" } } });
UserSchema.index({ profileType: 1, profileId: 1 });
// ─── Virtual: sessions ────────────────────────────────────
// Lets you do user.populate("sessions") to get all sessions for this user.
// No data is stored on the User document itself.
UserSchema.virtual("sessions", {
    ref: "Session",
    localField: "_id",
    foreignField: "userId",
});
// ─── Pre-save: hash password ──────────────────────────────
UserSchema.pre("save", async function () {
    if (!this.isModified("password"))
        return;
    const salt = await bcryptjs_1.default.genSalt(12);
    this.password = await bcryptjs_1.default.hash(this.password, salt);
});
// ─── Method: compare password ─────────────────────────────
UserSchema.methods.comparePassword = async function (plainPassword) {
    return bcryptjs_1.default.compare(plainPassword, this.password);
};
// ─── Method: invalidate all sessions ─────────────────────
// Call this on logout-all or password change to kill every active session.
UserSchema.methods.clearSessions = async function () {
    // const Session = (await import("./session.schema")).default;
    await auth_schema_1.default.updateMany({ userId: this._id, valid: true }, { valid: false });
};
// ─── toJSON: strip sensitive fields ──────────────────────
UserSchema.set("toJSON", {
    virtuals: false, // don't expose sessions array by default in JSON
    transform: (_doc, ret) => {
        const obj = ret;
        delete obj.password;
        delete obj.reset_token;
        delete obj.reset_token_exp;
        return obj;
    },
});
const User = (0, mongoose_1.model)("User", UserSchema);
exports.default = User;
//# sourceMappingURL=user.schema.js.map