import { Request } from "express";
import { GetProductQuery } from "../product/product.validation";
import mongoose, { Types } from "mongoose";
import { ICategoryDocument } from "../category/category.interface";
export declare const getProducts: (payload: {
    company_id: mongoose.Types.ObjectId;
    page: number;
    limit: number;
    search?: string;
    categoryId?: string;
    vendorId?: string;
    hasVariants?: boolean;
    is_active?: boolean;
    low_stock?: string;
    sort_by: string;
    sort_order: string;
}) => Promise<{
    products: (import("../product/product.interface").IProduct & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    })[];
    total: number;
}>;
export declare const dbTest: (req: Request, query: GetProductQuery) => Promise<{
    products: (import("../product/product.interface").IProduct & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    })[];
    total: number;
    page: number;
    limit: number;
}>;
export declare const getProductById: (payload: {
    id: string;
    company_id: mongoose.Types.ObjectId;
}) => Promise<{
    product: import("../product/product.interface").IProduct & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    };
    variants: any[];
}>;
export declare const getAllCategories: (req: Request) => Promise<(ICategoryDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
})[]>;
type AncestorItem = {
    _id: mongoose.Types.ObjectId;
    name: string;
    depth: number;
};
type CategorySearchItem = {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    fullPath: string;
    parentId: mongoose.Types.ObjectId | null;
    parentName: string | null;
    ancestors: AncestorItem[];
    depth: number;
    hasChildren: boolean;
    image: string | null;
};
export declare const searchCategories: (payload: {
    company_id: mongoose.Types.ObjectId;
    search?: string;
    skip: number;
    limit: number;
}) => Promise<{
    categories: CategorySearchItem[];
    total: number;
}>;
export {};
//# sourceMappingURL=public.service.d.ts.map