import mongoose from "mongoose";
import { Document } from "mongoose";
export declare enum ProductTag {
    NEW_ARRIVAL = "NEW_ARRIVAL",
    FLASH_SALE = "FLASH_SALE",
    TOP_DEALS = "TOP_DEALS",
    BEST_SELLER = "BEST_SELLER",
    FEATURED = "FEATURED",
    TRENDING = "TRENDING",
    POPULAR = "POPULAR",
    HOT = "HOT",
    ON_SALE = "ON_SALE",
    LIMITED_EDITION = "LIMITED_EDITION",
    EXCLUSIVE = "EXCLUSIVE",
    PRE_ORDER = "PRE_ORDER",
    COMING_SOON = "COMING_SOON",
    LOW_STOCK = "LOW_STOCK",
    BACK_IN_STOCK = "BACK_IN_STOCK",
    FREE_SHIPPING = "FREE_SHIPPING",
    TOP_RATED = "TOP_RATED",
    RECOMMENDED = "RECOMMENDED",
    CLEARANCE = "CLEARANCE",
    DISCOUNT = "DISCOUNT"
}
export declare enum ProductType {
    NEW = "NEW",
    PRE_OWNED = "PRE_OWNED"
}
export interface IProduct {
    sellerId: mongoose.Types.ObjectId;
    categoryId: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    productType: ProductType;
    description: string | null;
    specification: string | null;
    images: string[];
    sku: string;
    buyingPrice: number;
    sellingPrice: number;
    discount: number;
    profit: number;
    profitMargin: number;
    stock: number;
    lowStockAlert: number;
    displayPriceMin: number;
    displayPriceMax: number;
    totalStock: number;
    variantCount: number;
    hasDiscount: boolean;
    hasVariants: boolean;
    taxRate: number;
    isActive: boolean;
    tags: ProductTag[];
    showOnHomepage: boolean;
    asin: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export interface IProductDocument extends IProduct, Document {
}
//# sourceMappingURL=product.interface.d.ts.map