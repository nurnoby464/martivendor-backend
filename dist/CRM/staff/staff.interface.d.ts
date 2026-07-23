import { Document, Types } from "mongoose";
export interface IStaff {
    userId: Types.ObjectId;
    sellerId: Types.ObjectId;
    name: string;
    phone: string;
    email?: string | null;
    image?: string | null;
    designation?: string | null;
    department?: string | null;
    joining_date?: Date | null;
    salary?: number | null;
    nid?: string | null;
    nidImage?: string | null;
    address?: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface IStaffDocument extends IStaff, Document {
}
//# sourceMappingURL=staff.interface.d.ts.map