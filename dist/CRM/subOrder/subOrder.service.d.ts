import { Types } from "mongoose";
import { TSellerOrderListQuery } from "./subOrder.validation";
export declare const getSellerOrders: (sellerId: Types.ObjectId, query: TSellerOrderListQuery) => Promise<{
    orders: any[];
    total: number;
    statusCounts: Record<string, number>;
}>;
export declare const getSellerOrderById: (orderId: string, sellerId: Types.ObjectId) => Promise<{
    orderId: Types.ObjectId;
    orderNumber: string;
    subOrderId: Types.ObjectId;
    subOrderNumber: string;
    createdAt: Date;
    status: "pending" | "returned" | "cancelled" | "processing" | "shipped" | "delivered";
    statusHistory: import("./subOrder.interface").IStatusHistory[];
    customer: {
        name: string | undefined;
        phone: string;
    };
    shippingAddress: import("../order/order.interface").IShippingAddress;
    note: string | null;
    payment: {
        method: "cash" | "cash_on_delivery" | "card" | "mobile_banking" | "credit" | "online" | null;
        cashToCollect: number;
    };
    items: {
        productId: Types.ObjectId;
        variantId: Types.ObjectId;
        name: string;
        sku: string;
        image: string | null;
        quantity: number;
        sellingPrice: number;
        discountAmount: number;
        totalPrice: number;
    }[];
    totals: {
        subtotal: number;
        discountAmount: number;
        shippingCharge: number;
        total: number;
    };
    earnings: {
        commissionRate: number;
        commissionAmount: number;
        sellerEarning: number;
        payoutStatus: "paid" | "held" | "released" | "reversed";
        payoutReleaseAt: Date | null;
    };
    shipping: {
        trackingNumber: string | null;
        courierName: string | null;
        shippedAt: Date | null;
        deliveredAt: Date | null;
        cancelledAt: Date | null;
        cancelReason: string | null;
    };
}>;
//# sourceMappingURL=subOrder.service.d.ts.map