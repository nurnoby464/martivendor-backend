import { Types } from "mongoose";
import { IGetMyOrdersQuery } from "./order.interface";
import { TCreateOrderInput, TGetOrderListQuery } from "./order.validation";
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
export declare const getMyOrders: (customerId: Types.ObjectId, sellerId: Types.ObjectId, query: IGetMyOrdersQuery) => Promise<{
    orders: any;
    statusCounts: Record<string, number>;
    total: any;
}>;
export declare const getMyOrderById: (orderId: string) => Promise<import("./order.interface").IOrderDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
//# sourceMappingURL=order.service.d.ts.map