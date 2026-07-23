// audit.schema.ts
import { Schema, model } from "mongoose";
import { AUDIT_ACTIONS, AuditTargetModel, IAuditDocument } from "./audit.interface";

const TARGET_MODELS: AuditTargetModel[] = [
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

const PerformedBySchema = new Schema(
  {
    userId    : { type: Schema.Types.ObjectId, ref: "User",    required: true },
    name      : { type: String, required: true },
    email     : { type: String, required: true },
    role      : { type: String, required: true },
    sessionId : { type: String, required: true },
    ip        : { type: String, default: null },
    userAgent : { type: String, default: null },
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", default: null },
  },
  { _id: false },
);

const ChangesSchema = new Schema(
  {
    before: { type: Schema.Types.Mixed, default: null },
    after : { type: Schema.Types.Mixed, default: null },
  },
  { _id: false },
);

const AuditSchema = new Schema<IAuditDocument>(
  {
    sellerId: {
      type   : Schema.Types.ObjectId,
      ref    : "Seller",
      default: null,
    },

    performedBy: { type: PerformedBySchema, required: true },

    action: {
      type    : String,
      enum    : Object.values(AUDIT_ACTIONS),
      required: true,
    },

    status: {
      type   : String,
      enum   : ["success", "failed"],
      default: "success",
    },

    targetModel: {
      type   : String,
      enum   : TARGET_MODELS,
      default: null,
    },

    targetId: {
      type   : Schema.Types.ObjectId,
      default: null,
    },

    changes: {
      type   : ChangesSchema,
      default: () => ({ before: null, after: null }),
    },

    reason: { type: String, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────
AuditSchema.index({ sellerId              : 1, createdAt: -1 });
AuditSchema.index({ "performedBy.userId"    : 1, createdAt: -1 });
AuditSchema.index({ "performedBy.sessionId" : 1 });
AuditSchema.index({ action                  : 1, createdAt: -1 });
AuditSchema.index({ targetModel             : 1, createdAt: -1 }); // ← added, useful for "all vendor actions"
AuditSchema.index({ targetId               : 1, createdAt: -1 });
AuditSchema.index({ status                  : 1 });
AuditSchema.index({ createdAt              : -1 });

// ─── TTL — auto delete logs older than 1 year ─────────────
AuditSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });

const Audit = model<IAuditDocument>("Audit", AuditSchema);
export default Audit;