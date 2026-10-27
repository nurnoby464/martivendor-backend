import { Model, Types } from "mongoose";
import { ISessionDocument } from "../module/auth/auth.interface";
import { IUserDocument, ProfileType } from "../module/user/user.interface";
import { ITokenPayload } from "./jwtHelper";
import { discountType } from "../CRM/order/order.interface";
type IMakeToken = {
    existing: IUserDocument;
    session: ISessionDocument;
};
export declare const makeToken: (payload: IMakeToken) => ITokenPayload;
type IMakeLoginResponse = {
    user: IUserDocument;
};
export declare const profileModelMap: Record<ProfileType, Model<any>>;
export declare const makeLoginResponse: (payload: IMakeLoginResponse) => Promise<{
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
}>;
export declare const generateOPT: () => string;
export declare function generateAsin(): string;
export declare function extractAsin(combinedSlug: string): string | null;
export declare function escapeRegex(str: string): string;
export declare const normalizedBDPhone: (phone: string) => string;
interface ICalculateDiscount {
    lineBase: number;
    discountValue: number;
    discountType: discountType | null;
    quantity: number;
}
export declare const calculateDiscount: (input: ICalculateDiscount) => number;
interface ICalculateTaxRete {
    totalPrice: number;
    taxRate: number;
}
export declare const calculateTaxRate: (input: ICalculateTaxRete) => number;
export declare const makeObjectId: (value: string) => Types.ObjectId;
export {};
//# sourceMappingURL=helper.d.ts.map