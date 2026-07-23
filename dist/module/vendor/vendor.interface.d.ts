import mongoose, { Document } from "mongoose";
export interface IVendorNote {
    _id: mongoose.Types.ObjectId;
    text: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
}
export interface IVendor {
    sellerId: mongoose.Types.ObjectId;
    vendor_code: string;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    notes: IVendorNote[];
    total_payable: number;
    total_paid: number;
    due: number;
    is_active: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export interface IVendorDocument extends IVendor, Document {
}
//# sourceMappingURL=vendor.interface.d.ts.map