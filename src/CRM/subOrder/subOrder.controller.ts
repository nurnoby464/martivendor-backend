import { Request, Response } from "express";
import { Types } from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { AppError } from "../../middlewares/appError";
import * as SubOrderServices from "./subOrder.service";
import type { TSellerOrderListQuery } from "./subOrder.validation";

export const getSellerOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const rawSellerId = req.user.sellerId;
    if (!rawSellerId || !Types.ObjectId.isValid(String(rawSellerId))) {
      throw new AppError("Seller not found, unauthorized access", 403);
    }

    const sellerId = new Types.ObjectId(String(rawSellerId));

    const query = req.validatedQuery as unknown as TSellerOrderListQuery;
    const { orders, total, statusCounts } =
      await SubOrderServices.getSellerOrders(sellerId, query);

    return ApiResponse.paginated(
      res,
      "Orders fetched successfully",
      orders,
      total,
      query.page,
      query.limit,
      { statusCounts },
    );
  },
);

export const getSellerOrderById = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = req.user.sellerId;
    if (!sellerId || !Types.ObjectId.isValid(String(sellerId))) {
      throw new AppError("Unauthorized access. Seller id not found", 403);
    }
    const result = await SubOrderServices.getSellerOrderById(
      req.params.orderId as string,
      sellerId,
    );
    return ApiResponse.success(res, result, "Order fetched successfully");
  },
);
