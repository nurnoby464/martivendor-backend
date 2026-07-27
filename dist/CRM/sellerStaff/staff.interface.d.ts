import { Types, Document } from "mongoose";
export type SellerStaffDepartment = "product_management" | "order_fulfillment" | "customer_support" | "accounts";
export type SellerStaffPermission = "manage_products" | "manage_inventory" | "manage_orders" | "view_orders" | "manage_customer_chat" | "manage_reviews" | "view_payout" | "request_payout";
export type SellerStaffStatus = "active" | "inactive";
export interface ISellerStaff extends Document {
    sellerId: Types.ObjectId;
    userId: Types.ObjectId;
    name: string;
    department: SellerStaffDepartment;
    designation: string | null;
    permissions: SellerStaffPermission[];
    status: SellerStaffStatus;
    invitedBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=staff.interface.d.ts.map