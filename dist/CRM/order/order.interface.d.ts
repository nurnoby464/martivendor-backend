import { Document, Types } from "mongoose";
import { TCreateOrderInput } from "./order.validation";
export type TOrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
export type TPaymentStatus = "unpaid" | "partial" | "paid";
export interface IOrderItem {
    product: Types.ObjectId;
    variant: Types.ObjectId;
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
export interface IShippingAddress {
    name: string;
    phone: string;
    address: string;
    city: string;
    zip: string | null;
}
export interface IOrder {
    sellerId: Types.ObjectId;
    orderNumber: string;
    customer: Types.ObjectId;
    items: IOrderItem[];
    shippingAddress: IShippingAddress;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    shippingCharge: number;
    grandTotal: number;
    paidAmount: number;
    dueAmount: number;
    paymentStatus: "due" | "partial" | "paid";
    paymentMethod: "cash" | "cash_on_delivery" | "card" | "mobile_banking" | "credit" | "online" | null;
    orderStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
    note: string | null;
    notificationSent?: boolean;
    createdAt: Date;
}
export interface IOrderDocument extends IOrder, Document {
}
export interface ICreateOrderPayload {
    sellerId: Types.ObjectId;
    input: TCreateOrderInput;
}
export type IEmptyOrderItem = IOrderItem | [];
export interface OrderQuery {
    page: number;
    limit: number;
    search?: string;
    customerId?: string;
    paymentStatus?: TPaymentStatus;
    orderStatus?: TOrderStatus;
    sortBy: string;
    sortOrder: 1 | -1;
}
type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
export interface IGetMyOrdersQuery {
    page: number;
    limit: number;
    orderStatus?: OrderStatus | "all";
    search?: string;
}
export {};
//# sourceMappingURL=order.interface.d.ts.map