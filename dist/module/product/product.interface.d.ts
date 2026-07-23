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
    sku: string;
    buying_price: number;
    selling_price: number;
    profit: number;
    profit_margin: number;
    stock: number;
    low_stock_alert: number;
    display_price_min: number;
    display_price_max: number;
    total_stock: number;
    variant_count: number;
    has_discount: boolean;
    has_variants: boolean;
    taxRate: number;
    is_active: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export interface IProductDocument extends IProduct, Document {
}
//# sourceMappingURL=product.interface.d.ts.map