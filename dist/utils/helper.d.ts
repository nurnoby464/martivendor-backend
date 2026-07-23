import { ISessionDocument } from "../module/auth/auth.interface";
import { IUserDocument } from "../module/user/user.interface";
import { ITokenPayload } from "./jwtHelper";
type IMakeToken = {
    existing: IUserDocument;
    session: ISessionDocument;
};
export declare const makeToken: (payload: IMakeToken) => ITokenPayload;
type IMakeLoginResponse = {
    user: IUserDocument;
};
export declare const makeLoginResponse: (payload: IMakeLoginResponse) => Promise<{
    sellerId: null;
    profileId: null;
    profileType: null;
    _id: import("mongoose").Types.ObjectId;
    role: "report" | "sales" | "inventory" | "site_management" | "account" | "admin" | "super_admin" | "seller" | "staff" | "seller_staff" | "customer";
    isActive: boolean;
    emailVerified: boolean;
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
    _id: import("mongoose").Types.ObjectId;
    role: "report" | "sales" | "inventory" | "site_management" | "account" | "admin" | "super_admin" | "seller" | "staff" | "seller_staff" | "customer";
    sellerId: import("mongoose").Types.ObjectId | null;
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
    _id: import("mongoose").Types.ObjectId;
    role: "report" | "sales" | "inventory" | "site_management" | "account" | "admin" | "super_admin" | "seller" | "staff" | "seller_staff" | "customer";
    sellerId: import("mongoose").Types.ObjectId | null;
    isActive: boolean;
    emailVerified: boolean;
    profileId: any;
    name: any;
    email: any;
    phone: any;
    image: any;
}>;
export {};
//# sourceMappingURL=helper.d.ts.map