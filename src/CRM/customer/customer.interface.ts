import mongoose, { Document } from "mongoose";

export interface ICustomer {
  sellerId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;

  name: string;
  phone: string;
  email: string | null;
  image: string | null;
  dob: Date | null;
  gender: "male" | "female" | "other" | null;

  addresses: [
    {
      // _id: boolean;
      // label: string;
      // division: string;
      // district: string;
      // area: string;
      // zip: string;
      // isDefault: boolean;
      label: string;
      district: string;
      area: string;
      zip: string | null;
      isDefault: boolean;
    },
  ];

  totalPurchased: number;
  totalPaid: number;
  due: number;
  credit: number;

  //CRM
  tags: string[];
  lastPurchasedAt: Date | null;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}
export interface ICustomerDocument extends ICustomer, Document {}
