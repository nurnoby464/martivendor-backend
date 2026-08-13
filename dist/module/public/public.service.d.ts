import { Request } from "express";
import { GetProductQueryInput } from "./public.validation";
import { Types } from "mongoose";
import { ICategoryDocument } from "../category/category.interface";
import { CategorySearchItem, PublicCategoryNode } from "./public.interface";
export declare const getPublicMergedCategories: (payload: {
    page: number;
    limit: number;
}) => Promise<{
    categories: PublicCategoryNode[];
    total: number;
    page: number;
    limit: number;
}>;
export declare const getProducts: (payload: GetProductQueryInput) => Promise<{
    products: (import("../product/product.interface").IProduct & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    })[];
    total: number;
    categories: any[];
}>;
export declare const getProductFilterCategories: (payload: GetProductQueryInput) => Promise<any[]>;
export declare const getAllCategories: (req: Request) => Promise<(ICategoryDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
})[]>;
export declare const searchCategories: (payload: {
    search?: string;
    skip: number;
    limit: number;
}) => Promise<{
    categories: CategorySearchItem[];
    total: number;
}>;
export declare const getSuggestions: (search: string) => Promise<{
    categories: any[];
    products: any[];
    sellers: {
        name: string;
        slug: string;
        image: string | null;
    }[];
}>;
//# sourceMappingURL=public.service.d.ts.map