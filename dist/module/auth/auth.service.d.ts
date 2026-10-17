import mongoose, { Types } from "mongoose";
import { Request } from "express";
import { RegisterCustomerInput, RegisterSellerInput } from "../user/user.validation";
import { IResendOTPInput, IUpdateProfileRequest, IValidateOTPInput } from "./auth.validation";
import { IUserDocument } from "../user/user.interface";
interface ILogin {
    email: string;
    password: string;
}
interface IUpdatePassword {
    oldPassword: string;
    newPassword: string;
    userId: string;
    sessionId: string;
}
export declare const getMe: (userId: Types.ObjectId, sessionId: Types.ObjectId) => Promise<IUserDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const AuthServices: {
    login: (payload: ILogin, req: Request) => Promise<{
        user: {
            profileType: string;
            shopName: any;
            isPlatform: any;
            commissionRate: any;
            _id: Types.ObjectId;
            role: "report" | "sales" | "inventory" | "site_management" | "account" | "admin" | "user" | "super_admin" | "seller" | "staff" | "seller_staff" | "customer";
            sellerId: Types.ObjectId | null;
            isActive: boolean;
            emailVerified: boolean;
            profileId: any;
            name: any;
            email: any;
            phone: any;
            image: any;
        } | {
            profileType: string;
            shopName: any;
            slug: any;
            status: any;
            kycStatus: any;
            commissionRate: any;
            _id: Types.ObjectId;
            role: "report" | "sales" | "inventory" | "site_management" | "account" | "admin" | "user" | "super_admin" | "seller" | "staff" | "seller_staff" | "customer";
            sellerId: Types.ObjectId | null;
            isActive: boolean;
            emailVerified: boolean;
            profileId: any;
            name: any;
            email: any;
            phone: any;
            image: any;
        } | {
            profileType: string;
            department: any;
            designation: any;
            permissions: any;
            status: any;
            _id: Types.ObjectId;
            role: "report" | "sales" | "inventory" | "site_management" | "account" | "admin" | "user" | "super_admin" | "seller" | "staff" | "seller_staff" | "customer";
            sellerId: Types.ObjectId | null;
            isActive: boolean;
            emailVerified: boolean;
            profileId: any;
            name: any;
            email: any;
            phone: any;
            image: any;
        } | {
            profileType: string;
            is_profile_complete: boolean;
            dob: any;
            gender: any;
            addresses: any;
            _id: Types.ObjectId;
            role: "report" | "sales" | "inventory" | "site_management" | "account" | "admin" | "user" | "super_admin" | "seller" | "staff" | "seller_staff" | "customer";
            sellerId: Types.ObjectId | null;
            isActive: boolean;
            emailVerified: boolean;
            profileId: any;
            name: any;
            email: any;
            phone: any;
            image: any;
        } | {
            profileType: string;
            is_profile_complete: boolean;
            designation: any;
            department: any;
            joining_date: any;
            address: any;
            _id: Types.ObjectId;
            role: "report" | "sales" | "inventory" | "site_management" | "account" | "admin" | "user" | "super_admin" | "seller" | "staff" | "seller_staff" | "customer";
            sellerId: Types.ObjectId | null;
            isActive: boolean;
            emailVerified: boolean;
            profileId: any;
            name: any;
            email: any;
            phone: any;
            image: any;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    logout: (refreshToken: string) => Promise<void>;
    refresh: (refreshToken: string) => Promise<{
        accessToken: string;
    }>;
    removeSession: (sessionId: string, userId: string) => Promise<void>;
    updatePassword: (payload: IUpdatePassword) => Promise<{
        message: string;
    }>;
    registerCustomer: (sellerId: Types.ObjectId, input: RegisterCustomerInput) => Promise<{
        comparePassword(candidatePassword: string): Promise<boolean>;
        clearSessions(): Promise<void>;
        name: string;
        email: string;
        phone: string | null;
        passwordChangedAt?: Date | null;
        role: import("../user/user.interface").UserRole;
        sellerId: mongoose.Types.ObjectId | null;
        isActive: boolean;
        emailVerified: boolean;
        createdBy: mongoose.Types.ObjectId | null;
        lastLogin: Date | null;
        resetToken: string | null;
        resetTokenExp: Date | null;
        profileId: mongoose.Types.ObjectId;
        profileType: import("../user/user.interface").ProfileType;
        createdAt: Date;
        updatedAt: Date;
        _id: Types.ObjectId;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: mongoose.Collection;
        db: mongoose.Connection;
        errors?: mongoose.Error.ValidationError;
        isNew: boolean;
        schema: mongoose.Schema;
        __v: number;
    }>;
    getMe: (userId: Types.ObjectId, sessionId: Types.ObjectId) => Promise<IUserDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    updateProfile: (companyId: Types.ObjectId, userId: Types.ObjectId, input: IUpdateProfileRequest) => Promise<void>;
    registerSeller: (input: RegisterSellerInput) => Promise<mongoose.Document<unknown, {}, import("../seller/seller.interface").ISeller, {}, mongoose.DefaultSchemaOptions> & import("../seller/seller.interface").ISeller & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    verifySellerOPT: (payload: IValidateOTPInput) => Promise<mongoose.Document<unknown, {}, import("../seller/seller.interface").ISeller, {}, mongoose.DefaultSchemaOptions> & import("../seller/seller.interface").ISeller & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    resendOPT: (payload: IResendOTPInput) => Promise<import("../seller/seller.interface").ISeller & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
};
export {};
//# sourceMappingURL=auth.service.d.ts.map