import mongoose, { Types } from "mongoose";
import { CompanyUserInput, UpdateCompanyInput, UpdateSocialMediaInput, UpdateUserInput, UserQueryInput } from "./seller.validation";
import { Request } from "express";
import { TCreateNavItem, TDeleteNavItem, TUpdateNavItem } from "./seller.header.validation";
export declare const CompanyServices: {
    createCompanyUser: (payload: CompanyUserInput, req: Request) => Promise<import("../user/user.interface").IUserDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getAllUsers: (query: UserQueryInput, req: Request) => Promise<{
        user: (import("../user/user.interface").IUserDocument & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        })[];
        page: number;
        limit: number;
        total: number;
    }>;
    getUserById: (userId: string, req: Request) => Promise<import("../user/user.interface").IUserDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    updateUser: (userId: string, payload: UpdateUserInput, req: Request) => Promise<import("../user/user.interface").IUserDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    deleteUser: (userId: string, req: Request) => Promise<void>;
    getMyCompany: (id: Types.ObjectId) => Promise<(mongoose.Document<unknown, {}, import("./seller.interface").ISeller, {}, mongoose.DefaultSchemaOptions> & import("./seller.interface").ISeller & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    updateMyCompany: (companyId: Types.ObjectId, data: UpdateCompanyInput) => Promise<(import("./seller.interface").ISeller & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    updateSocialMedia: (companyId: Types.ObjectId, data: UpdateSocialMediaInput) => Promise<(import("./seller.interface").ISeller & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    createHeaderNav: (companyId: Types.ObjectId, input: TCreateNavItem) => Promise<mongoose.Document<unknown, {}, import("./seller.header.interface").INavConfig, {}, mongoose.DefaultSchemaOptions> & import("./seller.header.interface").INavConfig & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    getHeaderNav: (companyId: Types.ObjectId) => Promise<never[] | (import("./seller.header.interface").INavConfig & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })>;
    deleteHeaderNav: (companyId: Types.ObjectId, payload: TDeleteNavItem) => Promise<mongoose.Document<unknown, {}, import("./seller.header.interface").INavConfig, {}, mongoose.DefaultSchemaOptions> & import("./seller.header.interface").INavConfig & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updateHeaderNav: (companyId: Types.ObjectId, navId: Types.ObjectId, input: TUpdateNavItem) => Promise<mongoose.Document<unknown, {}, import("./seller.header.interface").INavConfig, {}, mongoose.DefaultSchemaOptions> & import("./seller.header.interface").INavConfig & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    reOrderHeaderNav: (companyId: Types.ObjectId, navConfigId: Types.ObjectId, input: {
        navItems: {
            _id: string;
            order: number;
        }[];
    }) => Promise<mongoose.Document<unknown, {}, import("./seller.header.interface").INavConfig, {}, mongoose.DefaultSchemaOptions> & import("./seller.header.interface").INavConfig & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
};
//# sourceMappingURL=seller.service.d.ts.map