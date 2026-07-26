import { model, Schema } from "mongoose";
import { ISellerStaff } from "./staff.interface";

const sellerStaffSchema = new Schema<ISellerStaff>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    name: { type: String, required: true, trim: true },
    department: {
      type: String,
      enum: ["product_management", "order_fulfillment", "customer_support", "accounts"],
      required: true,
      index: true,
    },
    designation: { type: String, default: null },
    permissions: [
      {
        type: String,
        enum: [
          "manage_products",
          "manage_inventory",
          "manage_orders",
          "view_orders",
          "manage_customer_chat",
          "manage_reviews",
          "view_payout",
          "request_payout",
        ],
      },
    ],

    status: { type: String, enum: ["active", "inactive"], default: "active" },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

sellerStaffSchema.index({ sellerId: 1, status: 1 });
sellerStaffSchema.index({ sellerId: 1, department: 1 });

export const SellerStaff = model<ISellerStaff>("SellerStaff", sellerStaffSchema);