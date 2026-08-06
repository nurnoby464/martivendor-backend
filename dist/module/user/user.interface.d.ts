import mongoose, { Document } from "mongoose";
export declare const USER_ROLES: readonly ["super_admin", "seller", "admin", "staff", "seller_staff", "account", "site_management", "inventory", "sales", "report", "customer"];
export declare const PROFILE_TYPE: readonly ["Seller", "Customer", "Staff", "SellerStaff"];
export type ProfileType = (typeof PROFILE_TYPE)[number];
export type UserRole = (typeof USER_ROLES)[number];
export interface IUser {
    name: string;
    email: string;
    phone: string | null;
    password: string;
    passwordChangedAt?: Date | null;
    role: UserRole;
    sellerId: mongoose.Types.ObjectId | null;
    isActive: boolean;
    emailVerified: boolean;
    createdBy: mongoose.Types.ObjectId | null;
    lastLogin: Date | null;
    resetToken: string | null;
    resetTokenExp: Date | null;
    profileId: mongoose.Types.ObjectId;
    profileType: ProfileType;
    createdAt: Date;
    updatedAt: Date;
}
export interface IUserDocument extends IUser, Document {
    comparePassword(candidatePassword: string): Promise<boolean>;
    clearSessions(): Promise<void>;
}
//# sourceMappingURL=user.interface.d.ts.map