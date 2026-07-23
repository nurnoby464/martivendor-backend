// category.interface.ts
import mongoose, { Document } from "mongoose";

export interface ICategory {
  sellerId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  parent_id: mongoose.Types.ObjectId | null;
  path: mongoose.Types.ObjectId[]; // ✅ Array of ObjectIds
  depth: number;
  image: string | null;
  is_active: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategoryDocument extends ICategory, Document {}