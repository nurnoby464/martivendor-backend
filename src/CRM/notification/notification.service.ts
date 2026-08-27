import { Types } from "mongoose";
import {
  getCategoryFromType,
  NotificationType,
} from "../../shared/notifications/constants";
import { Notification } from "./notification.schema";
import {
  CreateNotificationPayload,
  INotification,
  NotificationRelatedModel,
} from "./notification.interface";
import { AppError } from "../../middlewares/appError";
import { INotificationQueryInput } from "./notification.validation";

// /**
//  * Create a new notification in the database
//  * @param payload - Notification creation payload
//  * @returns Created notification document
//  * @throws Error if creation fails
//  */
export const create = async (
  payload: CreateNotificationPayload,
): Promise<INotification> => {
  if (
    !payload.userId ||
    !payload.sellerId ||
    !payload.audience ||
    !payload.type ||
    !payload.title ||
    !payload.message
  ) {
    throw new AppError(
      "Missing required fields: userId, type, title, message",
      400,
    );
  }

  // ✅ Validate required fields

  const userId = new Types.ObjectId(payload.userId);
  const sellerId = new Types.ObjectId(payload.sellerId);
  const relatedId = payload.relatedId
    ? new Types.ObjectId(payload.relatedId)
    : undefined;
  const category = getCategoryFromType(payload.type);

  const notification = await Notification.create({
    userId,
    sellerId,
    audience: payload.audience,
    type: payload.type,
    category,
    title: payload.title,
    message: payload.message,
    isRead: false,
    ...(relatedId && { relatedId }), // ✅ Only include if defined
    ...(payload.relatedModel && { relatedModel: payload.relatedModel }),
    ...(payload.data && { data: payload.data }),
  });

  console.log(
    `✅ Notification created: ${payload.type} | User: ${userId} | Title: ${payload.title}`,
  );

  return notification;
};

// ─── Other Functions ────────────────────────────────────────────────────────

/**
 * Mark a notification as read
 */
export const notificationMarkAsRead = async (
  notificationId: string | Types.ObjectId,
): Promise<INotification | null> => {
    if (!notificationId) {
      throw new AppError("Notification ID is required", 400);
    }

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true },
    );

    if (!notification) {
      console.warn(`⚠️  Notification not found: ${notificationId}`);
      return null;
    }

    console.log(`✅ Notification marked as read: ${notificationId}`);
    return notification;
  
  
};

/**
 * Mark multiple notifications as read
 */
export const notificationMarkMultipleAsRead = async (
  notificationIds: string[],
): Promise<{ modifiedCount: number }> => {
  try {
    if (!notificationIds || notificationIds.length === 0) {
      console.warn("⚠️  No notification IDs provided");
      return { modifiedCount: 0 };
    }

    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds.map((id) => new Types.ObjectId(id)) },
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );

    console.log(`✅ ${result.modifiedCount} notifications marked as read`);
    return { modifiedCount: result.modifiedCount };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `❌ Failed to mark notifications as read: ${errorMessage}`,
      error,
    );
    throw error;
  }
};

export const getNotificationList = async (
  userId: Types.ObjectId,
  query: INotificationQueryInput,
): Promise<{
  notifications: INotification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}> => {
  const filter: Record<string, unknown> = { userId };
  if (query.category) filter.category = query.category;
  if (query.isRead !== undefined) filter.isRead = query.isRead;

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return {
    notifications: notifications as INotification[],
    total,
    unreadCount,
    page,
    limit,
  };
};

/**
 * Get unread notification count for a user
 */
export const notificationGetUnreadCount = async (
  userId: string | Types.ObjectId,
): Promise<number> => {
  try {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const count = await Notification.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    });

    return count;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `❌ Failed to count unread notifications: ${errorMessage}`,
      error,
    );
    throw error;
  }
};

/**
 * Delete a notification
 */
export const notificationDelete = async (
  notificationId: string | Types.ObjectId,
): Promise<INotification | null> => {
  try {
    if (!notificationId) {
      throw new AppError("Notification ID is required", 400);
    }

    const result = await Notification.findByIdAndDelete(notificationId);

    if (!result) {
      console.warn(`⚠️  Notification not found: ${notificationId}`);
      return null;
    }

    console.log(`✅ Notification deleted: ${notificationId}`);
    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ Failed to delete notification: ${errorMessage}`, error);
    throw error;
  }
};

/**
 * Delete all notifications for a user
 */
export const notificationDeleteUserAll = async (
  userId: string | Types.ObjectId,
): Promise<{ deletedCount: number }> => {
  try {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const result = await Notification.deleteMany({
      userId: new Types.ObjectId(userId),
    });

    console.log(
      `✅ ${result.deletedCount} notifications deleted for user ${userId}`,
    );
    return { deletedCount: result.deletedCount };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `❌ Failed to delete user notifications: ${errorMessage}`,
      error,
    );
    throw error;
  }
};
