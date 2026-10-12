import { model, Schema } from "mongoose";
import {
  CUSTOMER_GENDERS,
  ICustomerAddress,
  ICustomerDocument,
} from "./customer.interface";

const addressSchema = new Schema<ICustomerAddress>({
  label: { type: String, required: true, default: "home" },
  district: { type: String, required: true },
  area: { type: String, required: true },
  zip: { type: String, default: null },
  isDefault: { type: Boolean, default: false },
});

const customerSchema = new Schema<ICustomerDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },

    image: { type: String, default: null },
    dob: { type: Date, default: null },
    gender: {
      type: String,
      enum: CUSTOMER_GENDERS,
      default: null,
    },
    addresses: { type: [addressSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);
// One person = one Customer, platform-wide.
customerSchema.index({ phone: 1 }, { unique: true });
customerSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      email: { $type: "string" },
    },
  },
);
customerSchema.index(
  { userId: 1 },
  { unique: true, partialFilterExpression: { userId: { $type: "objectId" } } },
);

const Customer = model<ICustomerDocument>("Customer", customerSchema);
export default Customer;
