import { Request } from "express";
import mongoose from "mongoose";
import Audit from "../module/audit/audit.schema";
import { AuditAction, AuditTargetModel } from "../module/audit/audit.interface";

interface IAuditParams {
  req: Request;
  action: AuditAction;
  status?: "success" | "failed";
  targetModel?: AuditTargetModel;
  targetId?: mongoose.Types.ObjectId;
  before?: Record<string, unknown> | null; // state before change
  after?: Record<string, unknown> | null; // state after change
  reason?: string; // error message on failure
}

// ─── Strip sensitive fields before storing ────────────────
const SENSITIVE_FIELDS = ["password", "reset_token", "reset_token_exp"];

const sanitize = (obj: Record<string, unknown> | null) => {
  if (!obj) return null;
  const clean = { ...obj };
  SENSITIVE_FIELDS.forEach((field) => delete clean[field]);
  return clean;
};

export const auditLog = (params: IAuditParams): void => {
  const {
    req,
    action,
    status = "success",
    targetModel,
    targetId,
    before,
    after,
    reason,
  } = params;

  // fire and forget — never await, never block main request
  Audit.create({
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
