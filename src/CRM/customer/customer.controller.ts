import { Types } from "mongoose";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import * as CustomerServices from "./customer.service";
import { Request, Response } from "express";
import { AppError } from "../../middlewares/appError";
import { CreateCustomerInput, GetCustomerQuery } from "./customer.validation";

export const getCustomerList = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = req.user.sellerId;

    if (!sellerId) {
      throw new AppError("Seller not found, Unauthorized access", 403);
    }

    const { customers, total, page, limit } =
      await CustomerServices.getCustomerList(
        req.validatedQuery as GetCustomerQuery,
      );
    return ApiResponse.paginated(
      res,
      "All customer fetch successfully",
      customers,
      total,
      page,
      limit,
    );
  },
);
export const createCustomer = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = req.user.profileId;
    if (!sellerId)
      throw new AppError("SellerId not found, Unauthorized access!", 403);
    const result = await CustomerServices.createCustomer(
      new Types.ObjectId(sellerId),
      req.body as CreateCustomerInput,
    );
    return ApiResponse.success(res, result, "Customer created successfully");
  },
);

