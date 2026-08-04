"use strict";
// // audit.interface.ts
// import mongoose, { Document } from "mongoose";
Object.defineProperty(exports, "__esModule", { value: true });
// export const AUDIT_ACTIONS = {
//   // Auth
//   LOGIN                : "LOGIN",
//   LOGIN_FAILED         : "LOGIN_FAILED",
//   LOGOUT               : "LOGOUT",
//   PASSWORD_CHANGED     : "PASSWORD_CHANGED",
//   TOKEN_REFRESHED      : "TOKEN_REFRESHED",
//   // Company
//   COMPANY_CREATED      : "COMPANY_CREATED",
//   COMPANY_UPDATED      : "COMPANY_UPDATED",
//   COMPANY_DELETED      : "COMPANY_DELETED",
//   // User
//   USER_CREATED         : "USER_CREATED",
//   USER_UPDATED         : "USER_UPDATED",
//   USER_DELETED         : "USER_DELETED",
//   USER_ACTIVATED       : "USER_ACTIVATED",
//   USER_DEACTIVATED     : "USER_DEACTIVATED",
//   // Session
//   SESSION_REMOVED      : "SESSION_REMOVED",
//   // Vendor
//   VENDOR_CREATED       : "VENDOR_CREATED",
//   VENDOR_UPDATED       : "VENDOR_UPDATED",
//   VENDOR_DELETED       : "VENDOR_DELETED",
//   VENDOR_NOTE_ADDED    : "VENDOR_NOTE_ADDED",
//   VENDOR_NOTE_DELETED  : "VENDOR_NOTE_DELETED",
//   // Category
//   CATEGORY_CREATED     : "CATEGORY_CREATED",
//   CATEGORY_UPDATED     : "CATEGORY_UPDATED",
//   CATEGORY_DELETED     : "CATEGORY_DELETED",
//   // Product
//   PRODUCT_CREATED      : "PRODUCT_CREATED",
//   PRODUCT_UPDATED      : "PRODUCT_UPDATED",
//   PRODUCT_DELETED      : "PRODUCT_DELETED",
//   // Product Variant
//   VARIANT_CREATED      : "VARIANT_CREATED",
//   VARIANT_UPDATED      : "VARIANT_UPDATED",
//   VARIANT_DELETED      : "VARIANT_DELETED",
//   // Purchase
//   PURCHASE_CREATED     : "PURCHASE_CREATED",
//   PURCHASE_UPDATED     : "PURCHASE_UPDATED",
//   PURCHASE_DELETED     : "PURCHASE_DELETED",
//   PURCHASE_PAYMENT_UPDATED     : "PURCHASE_PAYMENT_UPDATED",
// } as const;
// export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
// export type AuditTargetModel =
//   | "User"
//   | "Seller"
//   | "Session"
//   | "Vendor"
//   | "Category"
//   | "Product"
//   | "ProductVariant"
//   | "Purchase"
//   | null;
// export interface IPerformedBy {
//   userId    : mongoose.Types.ObjectId;
//   name      : string;
//   email     : string;
//   role      : string;
//   sessionId : string;
//   ip        : string | null;
//   userAgent : string | null;
//   company_id: mongoose.Types.ObjectId | null;
// }
// export interface IChanges {
//   before: Record<string, unknown> | null;
//   after : Record<string, unknown> | null;
// }
// export interface IAudit {
//   company_id  : mongoose.Types.ObjectId | null;
//   performedBy : IPerformedBy;
//   action      : AuditAction;
//   status      : "success" | "failed";
//   targetModel : AuditTargetModel;
//   targetId    : mongoose.Types.ObjectId | null;
//   changes     : IChanges;
//   reason      : string | null;
//   createdAt   : Date;
// }
// export interface IAuditDocument extends IAudit, Document {}
//# sourceMappingURL=public.interface.js.map