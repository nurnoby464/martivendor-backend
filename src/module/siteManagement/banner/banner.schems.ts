import mongoose, { Schema, Types } from "mongoose";
import { IBannerDocument, IBannerModel } from "./banner.interface";

const BannerSchema = new Schema<IBannerDocument, IBannerModel>(
  {
    companyId: { type: Types.ObjectId, ref: "Company", required: true },
    text: {
      type: String,
      trim: true,
      maxlength: [500, "Text cannot exceed 500 characters"],
      default: null,
    },
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },
    imagePublicId: {
      type: String,
      trim: true,
      select: false,
    },
    active: {
      type: Boolean,
      default: false,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    linkUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true;
          try {
            new URL(v);
            return true;
          } catch {
            return false;
          }
        },
        message: "Please enter a valid URL",
      },
    },
    startDate: {
      type: Date,
      default: null,
    },
    // FIX 1: Simplified endDate validation without complex this typing
    endDate: {
      type: Date,
      default: null,
      validate: {
        validator: function (endDate: Date) {
          // Access startDate through the document
          const doc = this as any;
          const startDate = doc.startDate;
          if (!startDate || !endDate) return true;
          return new Date(endDate) > new Date(startDate);
        },
        message: "End date must be after start date",
      },
    },
  },
  {
    timestamps: true,
    // FIX 2: Handle imagePublicId deletion safely with type assertion
    toJSON: {
      transform: (_, ret: any) => {
        delete ret.__v;
        if (ret.imagePublicId !== undefined) {
          delete ret.imagePublicId;
        }
        return ret;
      },
    },
  },
);

// Compound index
BannerSchema.index({ active: 1, order: 1, createdAt: -1 });

// Instance method
BannerSchema.methods.isActive = function (this: IBannerDocument): boolean {
  if (!this.active) return false;

  const now = new Date();

  if (this.startDate && new Date(this.startDate) > now) return false;
  if (this.endDate && new Date(this.endDate) < now) return false;

  return true;
};

// Static method
BannerSchema.statics.getActiveBanners = async function (): Promise<
  IBannerDocument[]
> {
  const now = new Date();

  return this.find({
    active: true,
    $and: [
      {
        $or: [{ startDate: { $lte: now } }, { startDate: null }],
      },
      {
        $or: [{ endDate: { $gte: now } }, { endDate: null }],
      },
    ],
  }).sort({ order: 1, createdAt: -1 });
};

export const Banner = mongoose.model<IBannerDocument, IBannerModel>(
  "Banner",
  BannerSchema,
);
