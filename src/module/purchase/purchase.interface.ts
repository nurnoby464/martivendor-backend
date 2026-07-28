import mongoose, { Document } from "mongoose";

export interface IPurchaseItem {
  productId: mongoose.Types.ObjectId;
  variantId: mongoose.Types.ObjectId;
  productName: string;
  sku: string;
  color: string | null;
  size: string | null;
  quantity: number;
  unitPrice: number;
  sellingPrice: number;
  total: number;
}

export interface IPurchase {
  sellerId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  items: IPurchaseItem[];
  productIds: mongoose.Types.ObjectId[];
  itemCount: number;

  // Financials
  totalAmount: number; // Sum of all item totals (buying)
  paidAmount: number; // How much paid so far
  dueAmount: number; // totalAmount - paidAmount (auto)

  status: "pending" | "partial" | "paid";

  purchaseDate: Date;
  note: string | null;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPurchaseDocument extends IPurchase, Document {}