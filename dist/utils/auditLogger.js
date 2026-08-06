"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = void 0;
const audit_schema_1 = __importDefault(require("../module/audit/audit.schema"));
// ─── Strip sensitive fields before storing ────────────────
const SENSITIVE_FIELDS = ["password", "reset_token", "reset_token_exp"];
const sanitize = (obj) => {
    if (!obj)
        return null;
    const clean = { ...obj };
    SENSITIVE_FIELDS.forEach((field) => delete clean[field]);
    return clean;
};
const auditLog = (params) => {
    const { req, action, status = "success", targetModel, targetId, before, after, reason, } = params;
    // fire and forget — never await, never block main request
    audit_schema_1.default.create({
        sellerId: req.user.sellerId ?? null,
        performedBy: {
            userId: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            sessionId: req.user.sessionId,
            ip: req.ip ?? null,
            userAgent: req.headers["user-agent"] ?? null,
            sellerId: req.user.sellerId ?? null,
        },
        action,
        status,
        targetModel: targetModel ?? null,
        targetId: targetId ?? null,
        changes: {
            before: sanitize(before ?? null),
            after: sanitize(after ?? null),
        },
        reason: reason ?? null,
    }).catch((err) => {
        // audit failure must NEVER crash the main request
        console.error("⚠️  Audit log failed:", err);
    });
};
exports.auditLog = auditLog;
//# sourceMappingURL=auditLogger.js.map