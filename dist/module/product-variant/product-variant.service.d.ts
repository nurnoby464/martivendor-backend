import mongoose, { Types } from "mongoose";
import { Request } from "express";
import { CreateVariantInput, UpdateVariantInput } from "./product-variant.validation";
interface IGetProductVariant {
    req: Request;
}
export declare const createVariant: (payload: CreateVariantInput & {
    productId: string;
    sellerId: mongoose.Types.ObjectId;
}, req: Request) => Promise<mongoose.Document<unknown, {}, import("./product-variant.interface").IProductVariantDocument, {}, mongoose.DefaultSchemaOptions> & import("./product-variant.interface").IProductVariantDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const getVariants: (payload: {
    productId: string;
    sellerId: mongoose.Types.ObjectId;
}) => Promise<(import("./product-variant.interface").IProductVariantDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
})[]>;
export declare const getVariantById: (variantId: string, sellerId: mongoose.Types.ObjectId) => Promise<import("./product-variant.interface").IProductVariantDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const updateVariant: (variantId: string, sellerId: mongoose.Types.ObjectId, payload: UpdateVariantInput, req: Request) => Promise<import("./product-variant.interface").IProductVariantDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const deleteVariant: (payload: {
    id: string;
    productId: string;
    sellerId: mongoose.Types.ObjectId;
    req: Request;
}) => Promise<mongoose.Document<unknown, {}, import("./product-variant.interface").IProductVariantDocument, {}, mongoose.DefaultSchemaOptions> & import("./product-variant.interface").IProductVariantDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const getAllProductWithVariant: (payload: IGetProductVariant) => Promise<{
    data: {
        products: any;
        totalProduct: any;
        outOfStock: any;
        lowStock: any;
        reminderStock: any;
    };
    total: any;
    query: {
        page: number;
        limit: number;
        search: string;
        sortOrder: 1 | -1;
        sortBy: string;
        stock: "lowStock" | "outOfStock" | "reminderStock";
    };
}>;
export declare const editProductVariant: (req: Request) => Promise<mongoose.Document<unknown, {}, import("./product-variant.interface").IProductVariantDocument, {}, mongoose.DefaultSchemaOptions> & import("./product-variant.interface").IProductVariantDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export {};
//# sourceMappingURL=product-variant.service.d.ts.map