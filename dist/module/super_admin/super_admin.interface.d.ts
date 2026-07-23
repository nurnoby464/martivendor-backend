import mongoose, { Document } from "mongoose";
export declare const USER_ROLES: readonly ["super_admin", "admin", "account", "site_management", "inventory", "sales", "report", "customer"];
export type UserRole = (typeof USER_ROLES)[number];
export interface IUser {
    name: string;
    email: string;
    phone: string | null;
    password: string;
    passwordChangedAt?: Date | null;
    role: UserRole;
    sellerId: mongoose.Types.ObjectId | null;
    is_active: boolean;
    email_verified: boolean;
    createdBy: mongoose.Types.ObjectId | null;
    last_login: Date | null;
    reset_token: string | null;
    reset_token_exp: Date | null;
    profileId: mongoose.Types.ObjectId | null;
    profileType: "Staff" | "Customer" | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface IUserDocument extends IUser, Document {
    comparePassword(candidatePassword: string): Promise<boolean>;
    clearSessions(): Promise<void>;
}
//# sourceMappingURL=super_admin.interface.d.ts.map