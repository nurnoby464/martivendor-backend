import mongoose, { Types } from "mongoose";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import * as CustomerServices from "./customer.service";
import { Request, Response } from "express";
import { AppError } from "../../middlewares/appError";
import { GetCustomerQuery } from "./customer.validation";

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
