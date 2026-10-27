import mongoose, { Types } from "mongoose";
import { AppError } from "../../middlewares/appError";
import {
  CreateCustomerInput,
  GetCustomerQuery
} from "./customer.validation";
import Customer from "./customer.schema";
import { useSkip } from "../../utils/useSkip";
import SellerCustomer from "../sellerCustomer/sellerCustomer.schema";
import { escapeRegex } from "../../utils/helper";

const LIST_FIELDS =
  "customerId name phone source totalOrders totalPurchased totalPaid due credit tags lastPurchasedAt isActive createdAt ";

export const getCustomerList = async (query: GetCustomerQuery) => {
  const { page, limit, sortBy, sortOrder, isActive, search, phone } = query;

  const filter: Record<string, unknown> = {
    isActive: isActive ?? true,
  };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }
  // if(phone){
  //   filter.phone =  { $regex: phone, $options: "i" } }
  // }
  const [customers, total] = await Promise.all([
    Customer.find(filter)
      .skip(useSkip({ page, limit }))
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .lean(),
    Customer.countDocuments(filter),
  ]);
  return { customers, total, page, limit };
};

export const createCustomer = async (
  sellerId: Types.ObjectId,
  input: CreateCustomerInput,
) => {
  const { name, phone } = input;
  const customer = await Customer.findOneAndUpdate(
    { phone },
    { $setOnInsert: { name, phone } },
    { upsert: true, returnDocument: "after" },
  );

  if (!customer) throw new AppError("Failed to create Customer", 500);
  if (!customer.isActive)
    throw new AppError("This customer cannot be added", 403);

  try {
    const link = await SellerCustomer.create({
      sellerId,
      customerId: customer._id,
      name,
      phone,
      source: "pos",
    });
    return {
      _id: link._id,
      customerId: link.customerId,
      name: link.name,
      phone: link.phone,
      source: link.source,
      totalOrders: 0,
      totalPurchased: 0,
      totalPaid: 0,
      due: 0,
      credit: 0,
      tags: [],
      lastPurchasedAt: null,
    };
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw new AppError("This customer already exist", 409);
    }
    throw error;
  }
};
