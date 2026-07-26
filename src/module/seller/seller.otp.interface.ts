import {  Types } from "mongoose";

export interface ISellerOtp {
  sellerId: Types.ObjectId;
  otp: string;
  createdAt: Date;
  updatedAt: Date;
}