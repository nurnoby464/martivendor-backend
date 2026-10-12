import { Document, Types } from "mongoose";
import { PaymentMethod } from "../posSell/posSell.interface";
import { TCreateOrderInput } from "./order.validation";
import {
  TPaymentMethod,
  TPaymentStatus,
} from "../../globalTypes/payment.types";

export type TOrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface IShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  zip: string | null;
}

export interface IOrder {
  orderNumber: string;
  customerId: Types.ObjectId;
  shippingAddress: IShippingAddress;

  subOrderCount: number;

  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  grandTotal: number; // subtotal + taxTotal + shippingTotal

  paidAmount: number;
  dueAmount: number;
  paymentStatus: TPaymentStatus;
  paymentMethod: TPaymentMethod | null;
  paymentId: Types.ObjectId | null; // -> Payment

  note: string | null;
  notificationSent?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderDocument extends IOrder, Document {}

export interface ICreateOrderPayload {
  input: TCreateOrderInput;
}

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
type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface IGetMyOrdersQuery {
  page: number;
  limit: number;
  orderStatus?: OrderStatus | "all";
  search?: string; // order_number search
}
