import { model, Schema } from "mongoose";
import { ISellerOtp } from "./seller.otp.interface";

const sellerOtpSchema = new Schema<ISellerOtp>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
      match: /^\d{6}$/,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Automatically delete the document 1 minute after creation
sellerOtpSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 }
);

export const SellerOtp = model<ISellerOtp>(
  "SellerOtp",
  sellerOtpSchema
);