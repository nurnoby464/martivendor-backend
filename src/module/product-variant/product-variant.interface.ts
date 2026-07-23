import mongoose, { Document } from "mongoose";

export interface IAttribute {
  key: string; // "color" | "size" | "material" | anything
  value: string; // "Orange" | "M" | "Cotton" | anything
}

export interface IProductVariant {
  product_id: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;

  attributes: IAttribute[];

  sku: string; // auto-generated from parent SKU + attributes
  image: string | null; // ← NEW: colour/variant-specific photo

  buying_price: number;
  selling_price: number;
  profit: number; // auto
  profit_margin: number; // auto

  stock: number;
  low_stock_alert: number;

  discountType: "flat" | "percentage" | null;
  discountValue: number;

  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductVariantDocument extends IProductVariant, Document {}
