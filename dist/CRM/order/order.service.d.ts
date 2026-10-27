import mongoose, { Types } from "mongoose";
import { TCreateOrderInput, TGetOrderListQuery, TMyOrdersQuery } from "./order.validation";
import { TSubOrderStatus } from "../subOrder/subOrder.interface";
export declare const ENABLED_PAYMENT_METHODS: readonly ["cash_on_delivery"];
export declare const createOrder: (input: TCreateOrderInput, userId: Types.ObjectId | null) => Promise<Record<string, unknown>>;
export declare const getAllOrder: (sellerId: Types.ObjectId, query: TGetOrderListQuery) => Promise<{
    orders: (import("./order.interface").IOrderDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[];
    total: number;
    orderStatusCounts: any;
}>;
export declare const getMyOrders: (customerId: Types.ObjectId, query: TMyOrdersQuery) => Promise<{
    orders: {
        seller: {
            _id: Types.ObjectId;
            name: string;
            slug: string;
            image: string | null;
        } | null;
        orderId: Types.ObjectId;
        orderNumber: string;
        subOrderNumber: string;
        sellerId: Types.ObjectId;
        customerId: Types.ObjectId;
        items: import("../subOrder/subOrder.interface").ISubOrderItem[];
        subtotal: number;
        discountAmount: number;
        taxAmount: number;
        shippingCharge: number;
        total: number;
        commissionRate: number;
        commissionAmount: number;
        sellerEarning: number;
        status: TSubOrderStatus;
        statusHistory: import("../subOrder/subOrder.interface").IStatusHistory[];
        trackingNumber: string | null;
        courierName: string | null;
        shippedAt: Date | null;
        deliveredAt: Date | null;
        cancelledAt: Date | null;
        cancelReason: string | null;
        payoutStatus: import("../subOrder/subOrder.interface").TPayoutStatus;
        payoutReleaseAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        _id: Types.ObjectId;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: mongoose.Collection;
        db: mongoose.Connection;
        errors?: mongoose.Error.ValidationError;
        isNew: boolean;
        schema: mongoose.Schema;
        __v: number;
    }[];
    statusCounts: Record<"pending" | "returned" | "cancelled" | "processing" | "shipped" | "delivered", number>;
    total: number;
}>;
export declare const getMyOrderById: (orderId: string) => Promise<{
    order: number;
    paymentMethod: "cash" | "cash_on_delivery" | "card" | "mobile_banking" | "credit" | "online" | null;
    deliveryTo: string;
    shippingAddress: import("./order.interface").IShippingAddress;
    subOrder: {
        orderNumber: string;
        subOrderNumber: string;
        items: import("../subOrder/subOrder.interface").ISubOrderItem[];
        status: "pending" | "returned" | "cancelled" | "processing" | "shipped" | "delivered";
        shippingCharge: number;
    }[];
}>;
//# sourceMappingURL=order.service.d.ts.map