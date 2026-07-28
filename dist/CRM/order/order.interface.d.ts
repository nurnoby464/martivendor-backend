import { Document, Types } from "mongoose";
import { PaymentMethod } from "../sales/sales.interface";
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
    buyingPrice: number;
    total_price: number;
}
export interface IShippingAddress {
    name: string;
    phone: string;
    email: string | null;
    address: string;
    city: string;
    zip: string | null;
}
export interface IOrder {
    sellerId: Types.ObjectId;
    order_number: string;
    customer: Types.ObjectId;
    items: IOrderItem[];
    shipping_address: IShippingAddress;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    shipping_charge: number;
    grand_total: number;
    paid_amount: number;
    due_amount: number;
    payment_status: TPaymentStatus;
    payment_method: PaymentMethod | null;
    order_status: TOrderStatus;
    note: string | null;
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
    order_status?: OrderStatus | "all";
    search?: string;
}
export {};
//# sourceMappingURL=order.interface.d.ts.map