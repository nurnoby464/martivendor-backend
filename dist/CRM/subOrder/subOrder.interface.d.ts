import { Document, Types } from "mongoose";
export declare const SUB_ORDER_STATUSES: readonly ["pending", "processing", "shipped", "delivered", "cancelled", "returned"];
export declare const PAYOUT_STATUS: readonly ["held", "released", "paid", "reversed"];
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
    totalPrice: number;
}
export interface IStatusHistory {
    status: TSubOrderStatus;
    at: Date;
    by: Types.ObjectId | null;
    note: string | null;
}
export interface ISubOrder {
    orderId: Types.ObjectId;
    orderNumber: string;
    subOrderNumber: string;
    sellerId: Types.ObjectId;
    customerId: Types.ObjectId;
    items: ISubOrderItem[];
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    shippingCharge: number;
    total: number;
    commissionRate: number;
    commissionAmount: number;
    sellerEarning: number;
    status: TSubOrderStatus;
    statusHistory: IStatusHistory[];
    trackingNumber: string | null;
    courierName: string | null;
    shippedAt: Date | null;
    deliveredAt: Date | null;
    cancelledAt: Date | null;
    cancelReason: string | null;
    payoutStatus: TPayoutStatus;
    payoutReleaseAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface ISubOrderDocument extends ISubOrder, Document {
}
export type TSubOrderLineDraft = Omit<ISubOrderItem, "taxRate" | "taxAmount">;
export type TDraftSeller = {
    _id: Types.ObjectId;
    name: string;
    isPlatform: boolean;
    commissionRate: number;
    userId: Types.ObjectId;
};
export type TSubOrderDraft = {
    sellerId: string;
    seller: TDraftSeller;
    lines: TSubOrderLineDraft[];
    subOrderNumber: string;
};
//# sourceMappingURL=subOrder.interface.d.ts.map