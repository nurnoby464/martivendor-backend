import { Request } from "express";
import mongoose from "mongoose";
import { AuditAction, AuditTargetModel } from "../module/audit/audit.interface";
interface IAuditParams {
    req: Request;
    action: AuditAction;
    status?: "success" | "failed";
    targetModel?: AuditTargetModel;
    targetId?: mongoose.Types.ObjectId;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    reason?: string;
}
export declare const auditLog: (params: IAuditParams) => void;
export {};
//# sourceMappingURL=auditLogger.d.ts.map