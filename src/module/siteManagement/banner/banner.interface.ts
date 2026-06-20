import { Document, Model, Types } from "mongoose";

// Base Banner Interface
export interface IBanner {
  companyId:Types.ObjectId;
  text?: string | null;
  imageUrl: string;
  imagePublicId?: string;
  active: boolean;
  order: number;
  linkUrl?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBannerDocument extends IBanner, Document {
  _id: Types.ObjectId;
  isActive(): boolean;
}

export interface IBannerModel extends Model<IBannerDocument> {
  getActiveBanners(): Promise<IBannerDocument[]>;
}

// Query Parameters
export interface IBannerQueryParams {
  active?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
