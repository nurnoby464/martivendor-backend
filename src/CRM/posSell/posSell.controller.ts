import mongoose, { Types } from "mongoose";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import * as SaleServices from "./posSell.service";
import { Request, Response } from "express";

export const createSale = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = new mongoose.Types.ObjectId(req.user.sellerId!);
  const createdBy = new mongoose.Types.ObjectId(req.user._id);
  const createdByType =
    req.user.role !== "customer" && req.user.role !== "super_admin"
      ? "staff"
      : "system";

  const result = await SaleServices.createSale({
    input: req.body,
    sellerId,
    createdBy,
    createdByType,
  });
  return ApiResponse.created(res, result, "sales created successfully");
});
