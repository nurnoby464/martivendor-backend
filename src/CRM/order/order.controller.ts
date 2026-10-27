import  { Types } from "mongoose";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import * as OrderServices from "./order.service";
import { Request, Response } from "express";
import { AppError } from "../../middlewares/appError";
import { TMyOrdersQuery } from "./order.validation";

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  // const sellerId = req.body?.sellerId;
  // if (!sellerId) {
  //   return ApiResponse.error(res, "Created Order place failed", 400);
  // }

  const userId = req.user?._id ?? null;
  console.log(userId);
  const result = await OrderServices.createOrder(req.body, userId);
  return ApiResponse.created(res, result, "Order created successfully");
});

export const getAllOrder = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = req.user.sellerId;
  const limit = req.validatedQuery.limit as number;
  const page = req.validatedQuery.page as number;
  const sortBy = req.validatedQuery.sortBy as "name" | "createdAt" | "stock";
  const search = req.validatedQuery.search as string;
  const sortOrder = req.validatedQuery.sortOrder as 1 | -1;
  const orderStatus = req.validatedQuery.orderStatus as
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | undefined;
  const paymentStatus = req.validatedQuery.paymentStatus as
    | "partial"
    | "unpaid"
    | "paid"
    | undefined;
  const customerId = req.validatedQuery.customerId as string;

  if (!sellerId) {
    return ApiResponse.error(
      res,
      "unauthorized access. Seller id not found",
      403,
    );
  }
  const query = {
    limit,
    page,
    sortBy,
    sortOrder,
    search,
    orderStatus,
    paymentStatus,
    customerId,
  };
  const { orders, total, orderStatusCounts } = await OrderServices.getAllOrder(
    sellerId,
    query,
  );
  return ApiResponse.paginated(
    res,
    "Order fetched successfully",
    orders,
    total,
    page,
    limit,
    orderStatusCounts,
  );
});

export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.user.profileId as Types.ObjectId;
  if (!customerId) throw new AppError("Customer profile not found", 403);
  const query = req.validatedQuery as TMyOrdersQuery;
  const { orders, total, statusCounts } = await OrderServices.getMyOrders(
    customerId,
    query,
  );
  return ApiResponse.paginated(
    res,
    "My Orders fetched successfully",
    orders,
    total,
    query.page,
    query.limit,
    { statusCounts },
  );
});
export const getMyOrderById = asyncHandler(
  async (req: Request, res: Response) => {
    const { orderId } = req.params as { orderId: string };

    const order = await OrderServices.getMyOrderById(orderId);
    if (!order) {
      return ApiResponse.error(res, "Order not found", 404);
    }
    return ApiResponse.success(res, order, "My Order fetched successfully");
  },
);
