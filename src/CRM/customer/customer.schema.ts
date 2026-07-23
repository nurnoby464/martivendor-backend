import { model, Schema } from "mongoose";
import { ICustomerDocument } from "./customer.interface";

const customerSchema = new Schema<ICustomerDocument>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: null, trim: true },
    addresses: [
      {
        // _id: false,
        // label: { type: String, default: "home" }, // "home", "office"
        // division: { type: String },
        // district: { type: String },
        // area: { type: String },
        // zip: { type: String },
        // isDefault: { type: Boolean, default: false },
        label: { type: String, required: true }, // "home", "office"
        district: { type: String, required: true },
        area: { type: String, required: true },
        zip: { type: String, default: null },
        isDefault: { type: Boolean, default: false },
      },
    ],
    image: { type: String, default: null },
    dob: { type: Date, default: null },
    gender: {
      type: String,
      enum: ["male", "female", "other", null],
      default: null,
    },
    totalPurchased: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    due: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },

    //CRM
    tags: { type: [String], default: [] },
    lastPurchasedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

customerSchema.index({ sellerId: 1, phone: 1 }, { unique: true });
customerSchema.index(
  { sellerId: 1, email: 1 },
  { unique: true, sparse: true },
);
customerSchema.index({ sellerId: 1, due: -1 }); // desending order due report
customerSchema.index({ sellerId: 1, lastPurchasedAt: -1 }); // recent customers

const Customer = model<ICustomerDocument>("Customer", customerSchema);
export default Customer;
