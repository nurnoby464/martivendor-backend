import { asyncHandler } from "../../utils/asyncHandler";
import { Request, Response } from "express";
import * as NotificationServices from "./notification.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { AppError } from "../../middlewares/appError";
import { INotificationQueryInput } from "./notification.validation";

export const getNotificationList = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user._id;
    if (!userId) throw new AppError("Unauthorized access", 403);
    const { notifications, total, unreadCount, page, limit } =
      await NotificationServices.getNotificationList(
        userId,
        req.validatedQuery as INotificationQueryInput,
      );
    return ApiResponse.paginated(
      res,
      "Unread notification fetched successfully",
      notifications,
      total,
      page,
      limit,
      { unreadCount },
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

// notification.controller.ts — add
export const notificationMarkAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    const notificationId = req.params.notificationId as string;

    const result =
      await NotificationServices.notificationMarkAsRead(notificationId);
    if (!result) throw new AppError("Notification not found", 404);

    return ApiResponse.success(res, result, "Notification marked as read");
  },
);

export const notificationMarkMultipleAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    const { notificationIds } = req.body;

    const result =
      await NotificationServices.notificationMarkMultipleAsRead(
        notificationIds,
      );
    return ApiResponse.success(res, result, "Notifications marked as read");
  },
);
