import { Types, Document } from "mongoose";
export interface IInvoiceItem {
    product: Types.ObjectId;
    variant: Types.ObjectId;
    name: string;
    sku: string;
    quantity: number;
    sellingPrice: number;
    total_price: number;
}
export interface IInvoice {
    invoiceNumber: string;
    order: Types.ObjectId;
    sellerId: Types.ObjectId;
    customer: Types.ObjectId;
    items: IInvoiceItem[];
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    shippingCharge: number;
    grandTotal: number;
    paidAmount: number;
    dueAmount: number;
    paymentMethod: "cash" | "cash_on_delivery" | "card" | "mobile_banking" | "credit" | "online" | null;
    status: "unpaid" | "partial" | "paid" | "cancelled";
    issuedAt: Date;
    deliveryDate: Date | null;
    paidDate: Date | null;
    note: string | null;
}
export interface IInvoiceDocument extends IInvoice, Document {
}
//# sourceMappingURL=invoice.interface.d.ts.map