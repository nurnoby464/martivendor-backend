import mongoose, { Schema } from "mongoose";
import { INavConfig, INavItem } from "./seller.header.interface";


const NavItemSchema = new Schema<INavItem>(
  {
    label: { type: String, required: true, trim: true },
    keyword: { type: String, trim: true },
    sectionTitle: { type: String, trim: true },
    order: { type: Number, required: true },
    isActiveInNav: { type: Boolean, default: true },
    showOnHomepage: { type: Boolean, default: false },
  },
  { _id: true }
);

const NavConfigSchema = new Schema<INavConfig>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      unique: true,
    },
    navItems: { type: [NavItemSchema], default: [] },
  },
  { timestamps: true }
);

export const NavConfig = mongoose.model<INavConfig>("NavConfig", NavConfigSchema);

/// nev 
