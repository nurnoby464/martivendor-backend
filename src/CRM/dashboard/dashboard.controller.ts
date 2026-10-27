import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler";
import * as DashboardServices from "./dashboard.service";
import { Request, Response } from "express";
import { AppError } from "../../middlewares/appError";
import { ApiResponse } from "../../utils/ApiResponse";

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const rawSellerId = req.user.sellerId;
  if (!rawSellerId || !mongoose.Types.ObjectId.isValid(String(rawSellerId))) {
    throw new AppError("SellerId not found,Unauthorized access", 403);
  }
  const sellerId = new mongoose.Types.ObjectId(String(rawSellerId));
  const result = await DashboardServices.getStats(sellerId);
  return ApiResponse.success(res, result, "Sales Stats get successfully");
});
