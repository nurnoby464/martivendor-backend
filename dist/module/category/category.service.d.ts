import mongoose from "mongoose";
import { Request } from "express";
import { ICategoryDocument } from "./category.interface";
export declare const createCategory: (payload: {
    sellerId: mongoose.Types.ObjectId;
    name: string;
    parentId?: string | null;
    image?: string | null;
    createdBy: mongoose.Types.ObjectId;
    isActive: boolean;
    req: Request;
}) => Promise<mongoose.Document<unknown, {}, ICategoryDocument, {}, mongoose.DefaultSchemaOptions> & ICategoryDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const getCategoryTree: (payload: {
    sellerId: mongoose.Types.ObjectId;
    query?: string;
    skip: number;
    limit: number;
}) => Promise<{
    categories: CategorySearchItem[];
    total: number;
}>;
export declare const getCategories: (payload: {
    sellerId: mongoose.Types.ObjectId;
    page: number;
    limit: number;
    search?: string;
    parentId?: string | null;
    depth?: number;
    isActive?: boolean;
}) => Promise<{
    categories: (ICategoryDocument & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[];
    total: number;
}>;
export declare const getCategoryById: (payload: {
    id: string;
    sellerId: mongoose.Types.ObjectId;
}) => Promise<ICategoryDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const updateCategory: (payload: {
    id: string;
    sellerId: mongoose.Types.ObjectId;
    req: Request;
    data: {
        name?: string;
        image?: string | null;
        isActive?: boolean;
    };
}) => Promise<mongoose.Document<unknown, {}, ICategoryDocument, {}, mongoose.DefaultSchemaOptions> & ICategoryDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const deleteCategory: (payload: {
    id: string;
    sellerId: mongoose.Types.ObjectId;
    req: Request;
}) => Promise<mongoose.Document<unknown, {}, ICategoryDocument, {}, mongoose.DefaultSchemaOptions> & ICategoryDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
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
    sellerId: mongoose.Types.ObjectId;
    search?: string;
    skip: number;
    limit: number;
}) => Promise<{
    categories: CategorySearchItem[];
    total: number;
}>;
export {};
//# sourceMappingURL=category.service.d.ts.map