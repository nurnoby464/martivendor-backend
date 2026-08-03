import mongoose, { Types } from "mongoose";
import { generateSaleCode } from "../../utils/generateSaleCode";
import { AppError } from "../../middlewares/appError";
import Product from "../../module/product/product.schema";
import ProductVariant from "../../module/product-variant/product-variant.schema";
import { GetCustomerQuery } from "./sellerStaff.validation";
import { useSkip } from "../../utils/useSkip";
import Customer from "../customer/customer.schema";

export const getCustomerList = async (
  query: GetCustomerQuery,
  companyId: Types.ObjectId,
) => {
  const { page, limit, sort_by, sort_order, is_active } = query;

  const filter: Record<string, unknown> = {
    companyId,
    isActive: true,
  };
  const [customers, total] = await Promise.all([
    Customer.find(filter)
      .skip(useSkip({ page, limit }))
      .limit(limit)
      .sort({ [sort_by]: sort_order })
      .lean(),
    Customer.countDocuments(filter),
  ]);
  return { customers, total };
};
