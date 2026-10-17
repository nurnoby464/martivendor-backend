import mongoose, { Types } from "mongoose";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import * as CustomerServices from "./customer.service";
import { Request, Response } from "express";
import { AppError } from "../../middlewares/appError";
import { CreateCustomerInput, GetCustomerQuery } from "./customer.validation";
import { CreateBannerInput } from "../../module/siteManagement/banner/banner.validation";

export const getCustomerList = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = req.user.sellerId;

    if (!sellerId) {
      throw new AppError("Company not found", 404);
    }

    const { customers, total, page, limit } =
      await CustomerServices.getCustomerList(
        req.validatedQuery as GetCustomerQuery,
        sellerId,
      );
    return ApiResponse.paginated(
      res,
      "sales created successfully",
      customers,
      total,
      page,
      limit,
    );
  },
);
export const createCustomer = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await CustomerServices.createCustomer(
      req.body as CreateCustomerInput,
    );
    return ApiResponse.success(res, result, "Customer created successfully");
  },
);
