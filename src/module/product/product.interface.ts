import mongoose from "mongoose";
import { Document } from "mongoose";

export interface IProduct {
  sellerId: mongoose.Types.ObjectId;
  category_id: mongoose.Types.ObjectId;
  vendor_id: mongoose.Types.ObjectId;

  name: string;
  slug: string;
  description: string | null;
  images: string[];
  sku: string; // unique stock keeping unit

  buying_price: number; // cost from vendor
  selling_price: number; // price to customer
  profit: number; // selling_price - buying_price (auto)
  profit_margin: number; // (profit / selling_price) * 100 (auto)

  stock: number; // current stock (0 if has_variants)
  low_stock_alert: number; // alert when stock <= this

  display_price_min: number;
  display_price_max: number;
  total_stock: number;
  variant_count: number;
  has_discount: boolean;

  has_variants: boolean; // true → use ProductVariant
  taxRate: number;
  is_active: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductDocument extends IProduct, Document {}
