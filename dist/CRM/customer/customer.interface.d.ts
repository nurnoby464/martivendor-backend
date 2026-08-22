import mongoose, { Document } from "mongoose";
export interface ICustomer {
    sellerId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    name: string;
    phone: string;
    email?: string;
    image: string | null;
    dob: Date | null;
    gender: "male" | "female" | "other" | null;
    addresses: [
        {
            label: string;
            district: string;
            area: string;
            zip: string | null;
            isDefault: boolean;
        }
    ];
    totalPurchased: number;
    totalPaid: number;
    due: number;
    credit: number;
    tags: string[];
    lastPurchasedAt: Date | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ICustomerDocument extends ICustomer, Document {
}
//# sourceMappingURL=customer.interface.d.ts.map