"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationDeleteUserAll = exports.notificationDelete = exports.notificationGetUnreadCount = exports.getNotificationList = exports.notificationMarkMultipleAsRead = exports.notificationMarkAsRead = exports.create = void 0;
const mongoose_1 = require("mongoose");
const constants_1 = require("../../shared/notifications/constants");
const notification_schema_1 = require("./notification.schema");
const appError_1 = require("../../middlewares/appError");
// /**
//  * Create a new notification in the database
//  * @param payload - Notification creation payload
//  * @returns Created notification document
//  * @throws Error if creation fails
//  */
const create = async (payload) => {
    if (!payload.userId ||
        !payload.sellerId ||
        !payload.audience ||
        !payload.type ||
        !payload.title ||
        !payload.message) {
        throw new appError_1.AppError("Missing required fields: userId, type, title, message", 400);
    }
    // ✅ Validate required fields
    const userId = new mongoose_1.Types.ObjectId(payload.userId);
    const sellerId = new mongoose_1.Types.ObjectId(payload.sellerId);
    const relatedId = payload.relatedId
        ? new mongoose_1.Types.ObjectId(payload.relatedId)
        : undefined;
    const category = (0, constants_1.getCategoryFromType)(payload.type);
    const notification = await notification_schema_1.Notification.create({
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
    console.log(`✅ Notification created: ${payload.type} | User: ${userId} | Title: ${payload.title}`);
    return notification;
};
exports.create = create;
// ─── Other Functions ────────────────────────────────────────────────────────
/**
 * Mark a notification as read
 */
const notificationMarkAsRead = async (notificationId) => {
    if (!notificationId) {
        throw new appError_1.AppError("Notification ID is required", 400);
    }
    const notification = await notification_schema_1.Notification.findByIdAndUpdate(notificationId, {
        isRead: true,
        readAt: new Date(),
    }, { new: true });
    if (!notification) {
        console.warn(`⚠️  Notification not found: ${notificationId}`);
        return null;
    }
    console.log(`✅ Notification marked as read: ${notificationId}`);
    return notification;
};
exports.notificationMarkAsRead = notificationMarkAsRead;
/**
 * Mark multiple notifications as read
 */
const notificationMarkMultipleAsRead = async (notificationIds) => {
    try {
        if (!notificationIds || notificationIds.length === 0) {
            console.warn("⚠️  No notification IDs provided");
            return { modifiedCount: 0 };
        }
        const result = await notification_schema_1.Notification.updateMany({
            _id: { $in: notificationIds.map((id) => new mongoose_1.Types.ObjectId(id)) },
        }, {
            isRead: true,
            readAt: new Date(),
        });
        console.log(`✅ ${result.modifiedCount} notifications marked as read`);
        return { modifiedCount: result.modifiedCount };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`❌ Failed to mark notifications as read: ${errorMessage}`, error);
        throw error;
    }
};
exports.notificationMarkMultipleAsRead = notificationMarkMultipleAsRead;
const getNotificationList = async (userId, query) => {
    const filter = { userId };
    if (query.category)
        filter.category = query.category;
    if (query.isRead !== undefined)
        filter.isRead = query.isRead;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [notifications, total, unreadCount] = await Promise.all([
        notification_schema_1.Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        notification_schema_1.Notification.countDocuments(filter),
        notification_schema_1.Notification.countDocuments({ userId, isRead: false }),
    ]);
    return {
        notifications: notifications,
        total,
        unreadCount,
        page,
        limit,
    };
};
exports.getNotificationList = getNotificationList;
/**
 * Get unread notification count for a user
 */
const notificationGetUnreadCount = async (userId) => {
    try {
        if (!userId) {
            throw new appError_1.AppError("User ID is required", 400);
        }
        const count = await notification_schema_1.Notification.countDocuments({
            userId: new mongoose_1.Types.ObjectId(userId),
            isRead: false,
        });
        return count;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`❌ Failed to count unread notifications: ${errorMessage}`, error);
        throw error;
    }
};
exports.notificationGetUnreadCount = notificationGetUnreadCount;
/**
 * Delete a notification
 */
const notificationDelete = async (notificationId) => {
    try {
        if (!notificationId) {
            throw new appError_1.AppError("Notification ID is required", 400);
        }
        const result = await notification_schema_1.Notification.findByIdAndDelete(notificationId);
        if (!result) {
            console.warn(`⚠️  Notification not found: ${notificationId}`);
            return null;
        }
        console.log(`✅ Notification deleted: ${notificationId}`);
        return result;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`❌ Failed to delete notification: ${errorMessage}`, error);
        throw error;
    }
};
exports.notificationDelete = notificationDelete;
/**
 * Delete all notifications for a user
 */
const notificationDeleteUserAll = async (userId) => {
    try {
        if (!userId) {
            throw new appError_1.AppError("User ID is required", 400);
        }
        const result = await notification_schema_1.Notification.deleteMany({
            userId: new mongoose_1.Types.ObjectId(userId),
        });
        console.log(`✅ ${result.deletedCount} notifications deleted for user ${userId}`);
        return { deletedCount: result.deletedCount };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`❌ Failed to delete user notifications: ${errorMessage}`, error);
        throw error;
    }
};
exports.notificationDeleteUserAll = notificationDeleteUserAll;
//# sourceMappingURL=notification.service.js.map