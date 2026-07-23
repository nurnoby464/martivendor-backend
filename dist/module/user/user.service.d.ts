import mongoose from "mongoose";
import { ParsedQs } from "qs";
import { IUserDocument } from "./user.interface";
import { CreateNewCompanyInput, CreateUserInput } from "./user.validation";
import { ITokenPayload } from "../../utils/jwtHelper";
import { Request } from "express";
import { ISellerDocument } from "../seller/seller.interface";
import { CompanyQueryInput, UpdateCompanyInput } from "../seller/seller.validation";
interface ListQuery extends ParsedQs {
    page?: string;
    limit?: string;
    sellerId?: string;
    role?: string;
    is_active?: string;
}
interface ListResult {
    users: Record<string, any>[];
    total: number;
    page: number;
    limit: number;
}
export declare const createUser: (input: CreateUserInput, createdBy: mongoose.Types.ObjectId | null) => Promise<IUserDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const getUserById: (id: string) => Promise<IUserDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const listUsers: (rawQuery: ListQuery) => Promise<ListResult>;
export declare const deleteUser: (id: string, requestor: ITokenPayload) => Promise<void>;
export declare const toggleUserStatus: (id: string, requestor: ITokenPayload) => Promise<IUserDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const createCompany: (payload: CreateNewCompanyInput, req: Request) => Promise<{
    company: ISellerDocument;
    admin: any;
}>;
export declare const getAllCompanies: (query: CompanyQueryInput) => Promise<{
    companies: (ISellerDocument & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}>;
export declare const getCompanyById: (sellerId: string, req: Request) => Promise<ISellerDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const updateCompany: (sellerId: string, payload: UpdateCompanyInput, req: Request) => Promise<mongoose.Document<unknown, {}, ISellerDocument, {}, mongoose.DefaultSchemaOptions> & ISellerDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const deleteCompany: (sellerId: string, req: Request) => Promise<void>;
export {};
//# sourceMappingURL=user.service.d.ts.map