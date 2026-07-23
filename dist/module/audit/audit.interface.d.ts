import mongoose, { Document } from "mongoose";
export declare const AUDIT_ACTIONS: {
    readonly LOGIN: "LOGIN";
    readonly LOGIN_FAILED: "LOGIN_FAILED";
    readonly LOGOUT: "LOGOUT";
    readonly PASSWORD_CHANGED: "PASSWORD_CHANGED";
    readonly TOKEN_REFRESHED: "TOKEN_REFRESHED";
    readonly COMPANY_CREATED: "COMPANY_CREATED";
    readonly COMPANY_UPDATED: "COMPANY_UPDATED";
    readonly COMPANY_DELETED: "COMPANY_DELETED";
    readonly USER_CREATED: "USER_CREATED";
    readonly USER_UPDATED: "USER_UPDATED";
    readonly USER_DELETED: "USER_DELETED";
    readonly USER_ACTIVATED: "USER_ACTIVATED";
    readonly USER_DEACTIVATED: "USER_DEACTIVATED";
    readonly SESSION_REMOVED: "SESSION_REMOVED";
    readonly VENDOR_CREATED: "VENDOR_CREATED";
    readonly VENDOR_UPDATED: "VENDOR_UPDATED";
    readonly VENDOR_DELETED: "VENDOR_DELETED";
    readonly VENDOR_NOTE_ADDED: "VENDOR_NOTE_ADDED";
    readonly VENDOR_NOTE_DELETED: "VENDOR_NOTE_DELETED";
    readonly CATEGORY_CREATED: "CATEGORY_CREATED";
    readonly CATEGORY_UPDATED: "CATEGORY_UPDATED";
    readonly CATEGORY_DELETED: "CATEGORY_DELETED";
    readonly PRODUCT_CREATED: "PRODUCT_CREATED";
    readonly PRODUCT_UPDATED: "PRODUCT_UPDATED";
    readonly PRODUCT_DELETED: "PRODUCT_DELETED";
    readonly VARIANT_CREATED: "VARIANT_CREATED";
    readonly VARIANT_UPDATED: "VARIANT_UPDATED";
    readonly VARIANT_DELETED: "VARIANT_DELETED";
    readonly PURCHASE_CREATED: "PURCHASE_CREATED";
    readonly PURCHASE_UPDATED: "PURCHASE_UPDATED";
    readonly PURCHASE_DELETED: "PURCHASE_DELETED";
    readonly PURCHASE_PAYMENT_UPDATED: "PURCHASE_PAYMENT_UPDATED";
};
export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
export type AuditTargetModel = "User" | "Seller" | "Session" | "Vendor" | "Category" | "Product" | "ProductVariant" | "Purchase" | null;
export interface IPerformedBy {
    userId: mongoose.Types.ObjectId;
    name: string;
    email: string;
    role: string;
    sessionId: string;
    ip: string | null;
    userAgent: string | null;
    sellerId: mongoose.Types.ObjectId | null;
}
export interface IChanges {
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
}
export interface IAudit {
    sellerId: mongoose.Types.ObjectId | null;
    performedBy: IPerformedBy;
    action: AuditAction;
    status: "success" | "failed";
    targetModel: AuditTargetModel;
    targetId: mongoose.Types.ObjectId | null;
    changes: IChanges;
    reason: string | null;
    createdAt: Date;
}
export interface IAuditDocument extends IAudit, Document {
}
//# sourceMappingURL=audit.interface.d.ts.map