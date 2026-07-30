import mongoose from "mongoose";
import { Request } from "express";
import { CreateProductInput } from "./product.validation";
import { ProductType } from "./product.interface";
interface CreateProductContext {
    sellerId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
}
export declare function recalculateProductAggregates(productId: mongoose.Types.ObjectId, session?: mongoose.ClientSession): Promise<void>;
export declare function createProduct(ctx: CreateProductContext, input: CreateProductInput): Promise<(import("./product.interface").IProduct & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}) | null>;
export declare const getProducts: (payload: {
    sellerId: mongoose.Types.ObjectId;
    page: number;
    limit: number;
    search?: string;
    categoryId?: string;
    hasVariants?: boolean;
    isActive?: boolean;
    low_stock?: string;
    sortBy: string;
    sortOrder: string;
    productType: ProductType;
}) => Promise<{
    products: (import("./product.interface").IProduct & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    })[];
    total: number;
}>;
export declare const getProductById: (payload: {
    id: string;
    sellerId: mongoose.Types.ObjectId;
}) => Promise<{
    product: import("./product.interface").IProduct & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    };
    variants: any[];
}>;
export declare const getProductBySlug: (payload: {
    slug: string;
}) => Promise<{
    product: import("./product.interface").IProduct & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    };
    variants: any[];
}>;
export declare const updateProduct: (payload: {
    id: string;
    sellerId: mongoose.Types.ObjectId;
    req: Request;
    data: {
        categoryId?: string;
        vendor_id?: string;
        name?: string;
        description?: string | null;
        images?: string[];
        buyingPrice?: number;
        sellingPrice?: number;
        stock?: number;
        lowStockAlert?: number;
        isActive?: boolean;
    };
}) => Promise<mongoose.Document<unknown, {}, import("./product.interface").IProduct, {}, mongoose.DefaultSchemaOptions> & import("./product.interface").IProduct & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}>;
export declare const deleteProduct: (payload: {
    id: string;
    sellerId: mongoose.Types.ObjectId;
    req: Request;
}) => Promise<mongoose.Document<unknown, {}, import("./product.interface").IProduct, {}, mongoose.DefaultSchemaOptions> & import("./product.interface").IProduct & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}>;
export {};
//# sourceMappingURL=product.service.d.ts.map