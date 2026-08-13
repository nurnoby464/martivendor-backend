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
    userId: Types.ObjectId;
    isPlatform: boolean;
    name: string;
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
    commissionRate: number;
    status: SellerStatus;
    rejectionReason: string | null;
    approvedBy: Types.ObjectId | null;
    approvedAt: Date | null;
    rating: {
        average: number;
        count: number;
    };
    totalSales: number;
    totalOrders: number;
    walletBalance: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=seller.interface.d.ts.map