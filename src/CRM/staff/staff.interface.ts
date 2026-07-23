// staff.interface.ts
import { Document, Types } from "mongoose";

export interface IStaff {
  userId: Types.ObjectId;
  sellerId: Types.ObjectId;

  // Basic Info
  name: string;
  phone: string;
  email?: string | null;
  image?: string | null;

  // HR Info
  designation?: string | null;
  department?: string | null;
  joining_date?: Date | null;
  salary?: number | null;

  // Identity
  nid?: string | null;
  nidImage?: string | null;

  // Address
  address?: string | null;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface IStaffDocument extends IStaff, Document {}