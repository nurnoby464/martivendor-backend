import mongoose, { Document, Types } from "mongoose";

export interface ICustomerAddress {
  _id?: Types.ObjectId;
  label: string; // "home" | "office"
  district: string;
  area: string;
  zip: string | null;
  isDefault: boolean;
}

export interface ICustomer {
  userId: mongoose.Types.ObjectId | null; // null = guest / walk-in (no login)

  name: string;
  phone: string;
  email?: string;
  image: string | null;
  dob: Date | null;
  gender: "male" | "female" | "other" | null;
  addresses: ICustomerAddress[];
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}
export interface ICustomerDocument extends ICustomer, Document {}
