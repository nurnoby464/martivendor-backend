import mongoose, { Document, Types } from "mongoose";
export declare const CUSTOMER_GENDERS: readonly ["male", "female", "other", null];
export type TCustomerGender = (typeof CUSTOMER_GENDERS)[number];
export interface ICustomerAddress {
    _id?: Types.ObjectId;
    label: string;
    district: string;
    area: string;
    zip: string | null;
    isDefault: boolean;
}
export interface ICustomer {
    userId: mongoose.Types.ObjectId | null;
    name: string;
    phone: string;
    email?: string;
    image: string | null;
    dob: Date | null;
    gender: TCustomerGender;
    addresses: ICustomerAddress[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ICustomerDocument extends ICustomer, Document {
}
//# sourceMappingURL=customer.interface.d.ts.map