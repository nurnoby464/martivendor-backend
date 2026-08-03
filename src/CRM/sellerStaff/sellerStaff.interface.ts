import {  Types, Document } from "mongoose";

// which area of the shop this employee handles - drives default permission set in the UI,
// but actual authorization always checks the `permissions` array, not the department string
export type SellerStaffDepartment =
  | "product_management" // product entry, catalog updates, variant/stock edits
  | "order_fulfillment"  // confirm, pack, ship vendor orders
  | "customer_support"   // customer messages/chat, review replies
  | "accounts";          // view earnings, request payouts

// granular permissions - checked in guard middleware against this array,
// distinct from platform Staff permissions (which operate across all sellers)
export type SellerStaffPermission =
  | "manage_products"      // create/edit/delete own shop's products
  | "manage_inventory"     // update stock/price on variants
  | "manage_orders"        // confirm/ship vendor orders
  | "view_orders"          // read-only order access
  | "manage_customer_chat" // reply to customer messages/inquiries
  | "manage_reviews"       // reply to customer reviews
  | "view_payout"          // view earnings/payout history (no withdrawal)
  | "request_payout";      // can submit payout requests

export type SellerStaffStatus = "active" | "inactive";

export interface ISellerStaff extends Document {
  sellerId: Types.ObjectId; // ref Seller - the shop this employee belongs to
  userId: Types.ObjectId;   // ref User (profileType: 'SellerStaff', role: 'seller_staff')

  name: string;
  department: SellerStaffDepartment;
  designation: string | null; // e.g. "Inventory Manager"
  permissions: SellerStaffPermission[];

  status: SellerStaffStatus;
  invitedBy: Types.ObjectId; // ref User - the seller owner who created this account

  createdAt: Date;
  updatedAt: Date;
}