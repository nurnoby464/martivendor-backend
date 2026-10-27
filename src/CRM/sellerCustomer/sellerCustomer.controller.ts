import { Types } from "mongoose";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import * as SellerCustomerServices from "./sellerCustomer.service";
import { Request, Response } from "express";
import { AppError } from "../../middlewares/appError";
import { makeObjectId } from "../../utils/helper";
import { GetCustomerQuery } from "./sellerCustomer.validation";

export const getMyCustomers = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = req.user.sellerId;

    if (!sellerId) {
      throw new AppError("Seller not found, Unauthorized access", 403);
    }

    const { customers, total, page, limit } =
      await SellerCustomerServices.getMyCustomers(
        req.validatedQuery as GetCustomerQuery,
        sellerId,
      );
    return ApiResponse.paginated(
      res,
      "Get my all customer successfully",
      customers,
      total,
      page,
      limit,
    );
  },
);
export const updateTags = asyncHandler(async (req: Request, res: Response) => {
  // const sellerId = req.user.sellerId;

  // if (!sellerId) {
  //   throw new AppError("Seller not found, Unauthorized access", 403);
  // }
  const rawSellerCustomerId = req.params.id as String;
  if (
    !rawSellerCustomerId ||
    !Types.ObjectId.isValid(String(rawSellerCustomerId))
  ) {
    throw new AppError(
      "Seller customer Id params  not found or Id is invalid.",
      403,
    );
  }

  const result = await SellerCustomerServices.updateTags(
    makeObjectId(String(rawSellerCustomerId)),
    req.body,
  );
  return ApiResponse.success(res, result, "Tags added successfully");
});
export const updateStatus = asyncHandler(
  async (req: Request, res: Response) => {
    // const sellerId = req.user.sellerId;

    // if (!sellerId) {
    //   throw new AppError("Seller not found, Unauthorized access", 403);
    // }
    const rawSellerCustomerId = req.params.id as String;
    if (
      !rawSellerCustomerId ||
      !Types.ObjectId.isValid(String(rawSellerCustomerId))
    ) {
      throw new AppError(
        "Seller customer Id params  not found or Id is invalid.",
        403,
      );
    }

    const result = await SellerCustomerServices.updateStatus(
      makeObjectId(String(rawSellerCustomerId)),
      req.body,
    );
    return ApiResponse.success(
      res,
      result,
      "Customer status updated successfully",
    );
  },
);
