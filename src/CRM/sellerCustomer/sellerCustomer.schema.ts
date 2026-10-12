import { model, Schema } from "mongoose";
import { ISellerCustomerDocument } from "./sellerCustomer.interface";

const sellerCustomerSchema = new Schema<ISellerCustomerDocument>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },

    source: { type: String, enum: ["online", "pos"], default: "online" },

    totalOrders: { type: Number, default: 0 },
    totalPurchased: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    due: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },

    tags: { type: [String], default: [] },
    lastPurchasedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// the same customer can't be added twice to the same seller
sellerCustomerSchema.index({ sellerId: 1, customerId: 1 }, { unique: true });
sellerCustomerSchema.index({ sellerId: 1, phone: 1 });
sellerCustomerSchema.index({ sellerId: 1, due: -1 }); // due report
sellerCustomerSchema.index({ sellerId: 1, lastPurchasedAt: -1 }); // recent customers

const SellerCustomer = model<ISellerCustomerDocument>(
  "SellerCustomer",
  sellerCustomerSchema,
);
export default SellerCustomer;