import { Document, Types } from "mongoose";
export const SUB_ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;
export const PAYOUT_STATUS = ["held", "released", "paid", "reversed"] as const;

export type TSubOrderStatus = (typeof SUB_ORDER_STATUSES)[number];
export type TPayoutStatus = (typeof PAYOUT_STATUS)[number];


export interface ISubOrderItem {
  productId: Types.ObjectId;
  variantId: Types.ObjectId;
  name: string;
  sku: string;
  image: string | null;
  quantity: number;
  sellingPrice: number;
  discountType: "flat" | "percentage" | null;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalPrice: number; // sellingPrice * quantity - discountAmount  (before tax)
}

export interface IStatusHistory {
  status: TSubOrderStatus;
  at: Date;
  by: Types.ObjectId | null; // user who changed it (null = system)
  note: string | null;
}

export interface ISubOrder {
  orderId: Types.ObjectId; // -> parent Order
  orderNumber: string; // copy of parent's number (fast search, no join)
  subOrderNumber: string; // ORD-20261007-00001-1
  sellerId: Types.ObjectId;
  customerId: Types.ObjectId;

  items: ISubOrderItem[];

  subtotal: number; // sum(items.totalPrice)
  discountAmount: number; // info only
  taxAmount: number;
  shippingCharge: number;
  total: number; // subtotal + taxAmount + shippingCharge

  commissionRate: number; // percent, e.g. 10
  commissionAmount: number; // subtotal * rate / 100  (commission on items, not shipping)
  sellerEarning: number; // total - commissionAmount

  status: TSubOrderStatus;
  statusHistory: IStatusHistory[];

  trackingNumber: string | null;
  courierName: string | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  cancelReason: string | null;

  payoutStatus: TPayoutStatus;
  payoutReleaseAt: Date | null; // deliveredAt + return window (e.g. 7 days)
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubOrderDocument extends ISubOrder, Document {}
