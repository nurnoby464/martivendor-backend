import { Document, Types } from "mongoose";

export type TCustomerSource = "online" | "pos";

export interface ISellerCustomer {
  sellerId: Types.ObjectId;
  customerId: Types.ObjectId;

  name: string;
  phone: string;

  source: TCustomerSource;

  totalOrders: number;
  totalPurchased: number;
  totalPaid: number;
  due: number; // customer owes THIS seller (POS credit sale)
  credit: number; // seller owes customer (advance payment)

  tags: string[];
  lastPurchasedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export interface ISellerCustomerDocument extends ISellerCustomer, Document{}
