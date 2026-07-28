import mongoose, { Document } from "mongoose";

export interface IAttribute {
  key: string; // "color" | "size" | "material" | anything
  value: string; // "Orange" | "M" | "Cotton" | anything
}

export interface IProductVariant {
  productId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;

  attributes: IAttribute[];

  sku: string; // Auto-generated from parent SKU + attributes
  image: string | null; // Color/variant-specific photo

  buyingPrice: number;
  sellingPrice: number;
  profit: number; // Auto
  profitMargin: number; // Auto

  stock: number;
  lowStockAlert: number;

  discountType: "flat" | "percentage" | null;
  discountValue: number;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductVariantDocument
  extends IProductVariant,
    Document {}