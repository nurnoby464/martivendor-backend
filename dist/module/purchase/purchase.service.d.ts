import { Types } from "mongoose";
import mongoose from "mongoose";
import { CreatePurchaseInput, ListPurchaseQuery, UpdatePurchaseInput } from "./purchase.validation";
import { Request } from "express";
interface CreatePurchasePayload extends CreatePurchaseInput {
    sellerId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
}
export declare const createPurchase: (payload: CreatePurchasePayload, req: Request) => Promise<any>;
export declare const getPurchases: (sellerId: mongoose.Types.ObjectId, query: ListPurchaseQuery) => Promise<{
    purchases: (import("./purchase.interface").IPurchaseDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[];
    total: number;
}>;
export declare const getPurchaseById: (payload: {
    id: string;
    sellerId: mongoose.Types.ObjectId;
}) => Promise<import("./purchase.interface").IPurchaseDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const updatePayment: (id: string, sellerId: mongoose.Types.ObjectId, payload: UpdatePurchaseInput, req: Request) => Promise<mongoose.Document<unknown, {}, import("./purchase.interface").IPurchaseDocument, {}, mongoose.DefaultSchemaOptions> & import("./purchase.interface").IPurchaseDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const deletePurchase: (id: string, sellerId: mongoose.Types.ObjectId, req: Request) => Promise<void>;
export declare const updateStock: (req: Request) => Promise<mongoose.Document<unknown, {}, import("../product-variant/product-variant.interface").IProductVariantDocument, {}, mongoose.DefaultSchemaOptions> & import("../product-variant/product-variant.interface").IProductVariantDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export {};
//# sourceMappingURL=purchase.service.d.ts.map