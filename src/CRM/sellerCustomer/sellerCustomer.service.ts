import { Types } from "mongoose";
import { GetCustomerQuery, UpdateStatusInput, UpdateTagInput } from "./sellerCustomer.validation";
import { escapeRegex } from "../../utils/helper";
import SellerCustomer from "./sellerCustomer.schema";
import { useSkip } from "../../utils/useSkip";
import { AppError } from "../../middlewares/appError";

const LIST_FIELDS =
  "customerId name phone source totalOrders totalPurchased totalPaid due credit tags lastPurchasedAt isActive createdAt ";

export const getMyCustomers = async (
  query: GetCustomerQuery,
  sellerId: Types.ObjectId,
) => {
  const {
    page,
    phone,
    search,
    sortBy,
    sortOrder,
    isActive,
    limit,
    source,
    hasDue,
  } = query;

  const filter: Record<string, unknown> = {
    sellerId,
    isActive: isActive ?? true,
  };

  if (phone) filter.phone = phone;
  if (search) {
    const rx = { $regex: escapeRegex(search), $options: "i" };
    filter.$or = [{ name: rx }, { phone: rx }];
  }
  if (source) {
    filter.source = source;
  }
  if (hasDue) {
    filter.due = { $gt: 0 };
  }

  const [customers, total] = await Promise.all([
    SellerCustomer.find(filter)
      .select(LIST_FIELDS)
      .sort({ [sortBy]: sortOrder })
      .skip(useSkip({ page, limit }))
      .limit(limit)
      .lean(),
    SellerCustomer.countDocuments(filter),
  ]);

  return { customers, total, page, limit };
};

export const updateTags = async (
  sellerCustomerId: Types.ObjectId,
  input: UpdateTagInput,
) => {
  const { tags } = input;
  const uniqueTags = [...new Set(tags)];
  const result = await SellerCustomer.findOneAndUpdate(
    {
      _id: sellerCustomerId,
    },
    {
      $set: {
        tags: uniqueTags,
      },
    },
    { returnDocument: "after", runValidators: true },
  );
  if (!result) {
    throw new AppError("Seller customer not found", 404);
  }
  return result;
};
export const updateStatus = async (
  sellerCustomerId: Types.ObjectId,
  input: UpdateStatusInput,
) => {
  const { isActive } = input;
  const result = await SellerCustomer.findOneAndUpdate(
    {
      _id: sellerCustomerId,
    },
    {
      $set: {
        isActive,
      },
    },
    { returnDocument: "after", runValidators: true },
  );
  if (!result) {
    throw new AppError("Seller customer not found", 404);
  }
  return result;
};