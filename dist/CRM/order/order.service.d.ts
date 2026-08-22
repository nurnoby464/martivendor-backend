import mongoose, { Types } from "mongoose";
import { ICreateOrderPayload, IGetMyOrdersQuery } from "./order.interface";
import { TGetOrderListQuery } from "./order.validation";
export declare const createOrder: ({ sellerId, input }: ICreateOrderPayload) => Promise<mongoose.Document<unknown, {}, import("./order.interface").IOrderDocument, {}, mongoose.DefaultSchemaOptions> & import("./order.interface").IOrderDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
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