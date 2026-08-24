import { Types } from "mongoose";
import {
  getCategoryFromType,
  NotificationType,
} from "../../shared/notifications/constants";
import { Notification } from "./notification.schema";
import {
  INotification,
  NotificationRelatedModel,
} from "./notification.interface";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CreateNotificationPayload {
  userId: Types.ObjectId | string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: Types.ObjectId | string;
  relatedModel?: NotificationRelatedModel;
  data?: Record<string, any>;
}

// ─── Create Notification ────────────────────────────────────────────────────

/**
 * Create a new notification in the database
 * @param payload - Notification creation payload
 * @returns Created notification document
 * @throws Error if creation fails
 */
export const create = async (
  payload: CreateNotificationPayload,
): Promise<INotification> => {
  try {
    // ✅ Validate required fields
    if (
      !payload.userId ||
      !payload.type ||
      !payload.title ||
      !payload.message
    ) {
      throw new Error("Missing required fields: userId, type, title, message");
    }

    // ✅ Convert IDs
    const userId = new Types.ObjectId(payload.userId);
    const relatedId = payload.relatedId
      ? new Types.ObjectId(payload.relatedId)
      : undefined;

    // ✅ Extract category from type
    const category = getCategoryFromType(payload.type);

    // ✅ Create notification
    const notification = await Notification.create({
      userId,
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
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ Failed to create notification: ${errorMessage}`, error);
    throw error;
  }
};

// ─── Other Functions ────────────────────────────────────────────────────────

/**
 * Mark a notification as read
 */
export const notificationMarkAsRead = async (
  notificationId: string | Types.ObjectId,
): Promise<INotification | null> => {
  try {
    if (!notificationId) {
      throw new Error("Notification ID is required");
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
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `❌ Failed to mark notification as read: ${errorMessage}`,
      error,
    );
    throw error;
  }
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

/**
 * Get unread notifications for a user
 */
export const notificationGetUnread = async (
  userId: string | Types.ObjectId,
  limit: number = 50,
): Promise<INotification[]> => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const notifications = await Notification.find({
      userId: new Types.ObjectId(userId),
      isRead: false,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return notifications as INotification[];
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `❌ Failed to fetch unread notifications: ${errorMessage}`,
      error,
    );
    throw error;
  }
};

/**
 * Get unread notification count for a user
 */
export const notificationGetUnreadCount = async (
  userId: string | Types.ObjectId,
): Promise<number> => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
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
      throw new Error("Notification ID is required");
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
      throw new Error("User ID is required");
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
