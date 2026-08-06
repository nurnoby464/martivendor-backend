"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// audit.schema.ts
const mongoose_1 = require("mongoose");
const audit_interface_1 = require("./audit.interface");
const TARGET_MODELS = [
    "User",
    "Seller",
    "Session",
    "Vendor",
    "Category",
    "Product",
    "ProductVariant",
    "Purchase",
    null,
];
const PerformedBySchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true },
    sessionId: { type: String, required: true },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    sellerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Seller", default: null },
}, { _id: false });
const ChangesSchema = new mongoose_1.Schema({
    before: { type: mongoose_1.Schema.Types.Mixed, default: null },
    after: { type: mongoose_1.Schema.Types.Mixed, default: null },
}, { _id: false });
const AuditSchema = new mongoose_1.Schema({
    sellerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Seller",
        default: null,
    },
    performedBy: { type: PerformedBySchema, required: true },
    action: {
        type: String,
        enum: Object.values(audit_interface_1.AUDIT_ACTIONS),
        required: true,
    },
    status: {
        type: String,
        enum: ["success", "failed"],
        default: "success",
    },
    targetModel: {
        type: String,
        enum: TARGET_MODELS,
        default: null,
    },
    targetId: {
        type: mongoose_1.Schema.Types.ObjectId,
        default: null,
    },
    changes: {
        type: ChangesSchema,
        default: () => ({ before: null, after: null }),
    },
    reason: { type: String, default: null },
}, {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
});
// ─── Indexes ──────────────────────────────────────────────
AuditSchema.index({ sellerId: 1, createdAt: -1 });
AuditSchema.index({ "performedBy.userId": 1, createdAt: -1 });
AuditSchema.index({ "performedBy.sessionId": 1 });
AuditSchema.index({ action: 1, createdAt: -1 });
AuditSchema.index({ targetModel: 1, createdAt: -1 }); // ← added, useful for "all vendor actions"
AuditSchema.index({ targetId: 1, createdAt: -1 });
AuditSchema.index({ status: 1 });
AuditSchema.index({ createdAt: -1 });
// ─── TTL — auto delete logs older than 1 year ─────────────
AuditSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });
const Audit = (0, mongoose_1.model)("Audit", AuditSchema);
exports.default = Audit;
//# sourceMappingURL=audit.schema.js.map