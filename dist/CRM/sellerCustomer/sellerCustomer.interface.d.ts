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
    due: number;
    credit: number;
    tags: string[];
    lastPurchasedAt: Date | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ISellerCustomerDocument extends ISellerCustomer, Document {
}
//# sourceMappingURL=sellerCustomer.interface.d.ts.map