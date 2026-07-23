import mongoose from "mongoose";
import { ParsedQs } from "qs";
import { IUserDocument } from "./super_admin.interface";
import { CreateNewCompanyInput, CreateUserInput } from "./super_admin.validation";
import { ITokenPayload } from "../../utils/jwtHelper";
import { Request } from "express";
import { ICompanyDocument } from "../company/company.interface";
import { CompanyQueryInput, UpdateCompanyInput } from "../company/company.validation";
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
export declare const UserService: {
    createUser: (input: CreateUserInput, createdBy: mongoose.Types.ObjectId | null) => Promise<IUserDocument & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getUserById: (id: string) => Promise<IUserDocument & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }>;
    listUsers: (rawQuery: ListQuery) => Promise<ListResult>;
    deleteUser: (id: string, requestor: ITokenPayload) => Promise<void>;
    toggleUserStatus: (id: string, requestor: ITokenPayload) => Promise<IUserDocument & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }>;
    createCompany: (payload: CreateNewCompanyInput, req: Request) => Promise<{
        company: ICompanyDocument;
        admin: any;
    }>;
    getAllCompanies: (query: CompanyQueryInput) => Promise<{
        companies: (ICompanyDocument & Required<{
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
    getCompanyById: (companyId: string, req: Request) => Promise<ICompanyDocument & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }>;
    updateCompany: (companyId: string, payload: UpdateCompanyInput, req: Request) => Promise<mongoose.Document<unknown, {}, ICompanyDocument, {}, mongoose.DefaultSchemaOptions> & ICompanyDocument & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    deleteCompany: (companyId: string, req: Request) => Promise<void>;
};
export {};
//# sourceMappingURL=super_admin.service.d.ts.map