import { Request } from "express";
import { GetProductQuery } from "../product/product.validation";
import { GetProductQueryInput } from "./public.validation";
import mongoose, { Types } from "mongoose";
import { ICategoryDocument } from "../category/category.interface";
export declare const getProducts: (payload: GetProductQueryInput) => Promise<{
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
    search?: string;
    skip: number;
    limit: number;
}) => Promise<{
    categories: CategorySearchItem[];
    total: number;
}>;
export interface MergedCategoryItem {
    slug: string;
    name: string;
    image: string | null;
    sellerCount: number;
    productCount: number;
    hasChildren: boolean;
}
export declare const getCategoriesMenu: (payload: {
    search?: string;
    skip: number;
    limit: number;
}) => Promise<{
    categories: MergedCategoryItem[];
    total: number;
}>;
export interface PublicCategoryNode {
    slugPath: string[];
    slug: string;
    name: string;
    depth: number;
    parentSlugPath: string[] | null;
    image: string | null;
    sellerCount: number;
    hasChildren: boolean;
}
export declare const getPublicMergedCategories: (payload: {
    page: number;
    limit: number;
}) => Promise<{
    categories: PublicCategoryNode[];
    total: number;
    page: number;
    limit: number;
}>;
export {};
//# sourceMappingURL=public.service.d.ts.map