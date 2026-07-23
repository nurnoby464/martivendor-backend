import mongoose, { Document } from "mongoose";

export const USER_ROLES = [
  "super_admin",
  "seller",
  "admin",
  "staff",
  "seller_staff",
  "account",
  "site_management",
  "inventory",
  "sales",
  "report",
  "customer",
] as const;

export const PROFILE_TYPE = ["Seller" , "Customer" , "Staff" , "SellerStaff"] as const;
export type ProfileType =(typeof PROFILE_TYPE)[number]

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
  // Add these
  profileId: mongoose.Types.ObjectId;
  profileType: ProfileType;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  clearSessions(): Promise<void>;
}
