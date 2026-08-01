import { Types, Document } from "mongoose";

// export interface ICompanySnapshot {
//   name: string;
//   phone: string;
//   email: string | null;
//   address: string;
//   logo: string | null;
// }

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
  // company: ICompanySnapshot; // snapshot
  customer: Types.ObjectId;

  items: IInvoiceItem[];

  subtotal: number;
  discountAmount: number;
  taxAmount: number; // VAT
  shippingCharge: number;
  grandTotal: number;

  paidAmount: number;
  dueAmount: number;

 paymentMethod:
  | "cash"
  | "cash_on_delivery"
  | "card"
  | "mobile_banking"
  | "credit"
  | "online"
  | null;

  status: "unpaid" | "partial" | "paid" | "cancelled";

  issuedAt: Date;
  deliveryDate: Date | null; // estimated delivery
  paidDate: Date | null; // set when fully paid
  note: string | null;
}

export interface IInvoiceDocument extends IInvoice, Document {}
