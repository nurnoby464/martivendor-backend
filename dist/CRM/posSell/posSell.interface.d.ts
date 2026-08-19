import mongoose, { Document } from "mongoose";
export type PaymentMethod = "cash" | "cash_on_delivery" | "card" | "mobile_banking" | "credit";
export type PaymentStatus = "paid" | "partial" | "due";
export type SaleStatus = "completed" | "returned" | "cancelled";
export type DiscountType = "flat" | "percentage" | null;
export interface ISaleItem {
    productId: mongoose.Types.ObjectId;
    variantId: mongoose.Types.ObjectId;
    productName: string;
    attributes: [{
        key: string;
        value: string;
    }];
    sku: string;
    image: string | null;
    quantity: number;
    unitPrice: number;
    sellingPrice: number;
    discountType: DiscountType;
    discountValue: number;
    discount_amount: number;
    subtotal: number;
}
export interface ICustomerSnapshot {
    name: string;
    phone: string;
    customerId: mongoose.Types.ObjectId | null;
}
export interface ISale {
    sellerId: mongoose.Types.ObjectId;
    saleCode: string;
    customer: ICustomerSnapshot | null;
    items: ISaleItem[];
    grossAmount: number;
    discountTotal: number;
    netAmount: number;
    paidAmount: number;
    dueAmount: number;
    changeAmount: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    creditUsed: number;
    saleDate: Date;
    note: string | null;
    status: SaleStatus;
    createdBy: mongoose.Types.ObjectId | null;
    createdByType: "staff" | "system";
    createdAt: Date;
    updatedAt: Date;
}
export interface ISaleDocument extends ISale, Document {
}
//# sourceMappingURL=posSell.interface.d.ts.map