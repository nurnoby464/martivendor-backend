import mongoose from "mongoose";
import { Request } from "express";
export declare const getProducts: (payload: {
    sellerId: mongoose.Types.ObjectId;
    page: number;
    limit: number;
    search?: string;
    category_id?: string;
    vendor_id?: string;
    has_variants?: boolean;
    is_active?: boolean;
    low_stock?: string;
    sort_by: string;
    sort_order: string;
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
export declare const updateProduct: (payload: {
    id: string;
    sellerId: mongoose.Types.ObjectId;
    req: Request;
    data: {
        category_id?: string;
        vendor_id?: string;
        name?: string;
        description?: string | null;
        images?: string[];
        buying_price?: number;
        selling_price?: number;
        stock?: number;
        low_stock_alert?: number;
        is_active?: boolean;
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
//# sourceMappingURL=product.service.d.ts.map