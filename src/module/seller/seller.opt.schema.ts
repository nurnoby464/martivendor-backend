import { model, Schema } from "mongoose";
import { IOtp } from "./seller.otp.interface";

const otpSchema = new Schema<IOtp>(
  {
    userId: {
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
    expiresAt: {
    type: Date,
    required: true,
  },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Automatically delete the document 1 minute after creation
otpSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0}
);

export const Otp = model<IOtp>(
  "Otp",
  otpSchema
);