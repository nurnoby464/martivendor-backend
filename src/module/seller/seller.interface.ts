import { Document, Types } from "mongoose";

export type SellerStatus = "pending" | "approved" | "rejected" | "suspended";
export type KycStatus = "not_submitted" | "pending" | "verified" | "rejected";
export type PayoutMethod = "bank" | "bkash" | "nagad" | "rocket";
 
export interface IBankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  branchName: string;
  routingNumber: string | null;
}
 
export interface IMobileBankingDetails {
  provider: "bkash" | "nagad" | "rocket";
  accountNumber: string;
}
 
export interface ISeller extends Document {
  // ref User. For a vendor this is their seller-login account (profileType: 'Seller').
  // For the platform seller, this is the super_admin's own User account
  // (that User's profileId/profileType point here) — no separate login needed.
  userId: Types.ObjectId;
 
  // true for the single record representing the company's own storefront.
  // lets Product.sellerId stay uniform for both platform + vendor products.
  // commissionRate is forced to 0 for this record (see pre-save hook below).
  isPlatform: boolean;
 
  name: string;
  nameLower: string;
  slug: string;
  image: string | null;
  banner: string | null;
  description: string | null;
 
  kyc: {
    nidNumber: string | null;
    nidFrontImage: string | null;
    nidBackImage: string | null;
    tradeLicenseNumber: string | null;
    tradeLicenseImage: string | null;
    tinNumber: string | null;
    status: KycStatus;
    rejectionReason: string | null;
  };
 
  payout: {
    preferredMethod: PayoutMethod | null;
    bank: IBankDetails | null;
    mobileBanking: IMobileBankingDetails | null;
  };
 
  commissionRate: number; // percentage, e.g. 10 = 10%. platform default can override per-category later
  status: SellerStatus;
  rejectionReason: string | null;
  approvedBy: Types.ObjectId | null; // ref User (super_admin)
  approvedAt: Date | null;
 
  rating: { average: number; count: number };
  totalSales: number;
  totalOrders: number;
  walletBalance: number; // available earnings not yet paid out
  isActive:boolean;
 
  createdAt: Date;
  updatedAt: Date;
}