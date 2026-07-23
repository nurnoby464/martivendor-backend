import mongoose, { Document } from "mongoose";
export interface IAttribute {
    key: string;
    value: string;
}
export interface IProductVariant {
    product_id: mongoose.Types.ObjectId;
    sellerId: mongoose.Types.ObjectId;
    attributes: IAttribute[];
    sku: string;
    image: string | null;
    buying_price: number;
    selling_price: number;
    profit: number;
    profit_margin: number;
    stock: number;
    low_stock_alert: number;
    discountType: "flat" | "percentage" | null;
    discountValue: number;
    is_active: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface IProductVariantDocument extends IProductVariant, Document {
}
//# sourceMappingURL=product-variant.interface.d.ts.map