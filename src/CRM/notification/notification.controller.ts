import { asyncHandler } from "../../utils/asyncHandler";
import { Request, Response } from "express";
import * as NotificationServices from "./notification.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { AppError } from "../../middlewares/appError";

export const notificationGetUnread = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user.sellerId;
    if (!userId) throw new AppError("Unauthorized access", 403);
    const result = await NotificationServices.notificationGetUnread(userId);
    return ApiResponse.success(
      res,
      result,
      "Unread notification fetched successfully",
    );
  },
);
export const notificationGetUnreadCount = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user._id;

    const result =
      await NotificationServices.notificationGetUnreadCount(userId);
    return ApiResponse.success(
      res,
      result,
      "Unread notification count fetched successfully",
    );
  },
);
