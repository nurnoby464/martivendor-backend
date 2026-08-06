import mongoose, { Document } from "mongoose";
export interface IAttribute {
    key: string;
    value: string;
}
export interface IProductVariant {
    productId: mongoose.Types.ObjectId;
    sellerId: mongoose.Types.ObjectId;
    attributes: IAttribute[];
    sku: string;
    image: string | null;
    buyingPrice: number;
    sellingPrice: number;
    profit: number;
    profitMargin: number;
    stock: number;
    lowStockAlert: number;
    discountType: "flat" | "percentage" | null;
    discountValue: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface IProductVariantDocument extends IProductVariant, Document {
}
//# sourceMappingURL=product-variant.interface.d.ts.map