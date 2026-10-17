import mongoose, { Types } from "mongoose";
import { generateSaleCode } from "../../utils/generateSaleCode";
import { AppError } from "../../middlewares/appError";
import Product from "../../module/product/product.schema";
import ProductVariant from "../../module/product-variant/product-variant.schema";
import { CreateCustomerInput, GetCustomerQuery } from "./customer.validation";
import Customer from "./customer.schema";
import { useSkip } from "../../utils/useSkip";

export const getCustomerList = async (
  query: GetCustomerQuery,
  sellerId: Types.ObjectId,
) => {
  const { page, limit, sort_by, sort_order, is_active, search, phone } = query;

  const filter: Record<string, unknown> = {
    sellerId,
    isActive: true,
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
      .sort({ [sort_by]: sort_order })
      .lean(),
    Customer.countDocuments(filter),
  ]);
  return { customers, total, page, limit };
};

export const createCustomer = async (input: CreateCustomerInput) => {
  const { name, email } = input;
  const existing = await Customer.findOne({ email }).lean();
  if (existing) throw new AppError("This customer already exist", 409);
  const newCustomer = await Customer.create({ name, email });
  if (!newCustomer) throw new AppError("Failed to create customer", 500);
  return newCustomer;
};
