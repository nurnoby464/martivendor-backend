import { Types } from "mongoose";
import { CreateNotificationPayload, INotification } from "./notification.interface";
import { INotificationQueryInput } from "./notification.validation";
export declare const create: (payload: CreateNotificationPayload) => Promise<INotification>;
/**
 * Mark a notification as read
 */
export declare const notificationMarkAsRead: (notificationId: string | Types.ObjectId) => Promise<INotification | null>;
/**
 * Mark multiple notifications as read
 */
export declare const notificationMarkMultipleAsRead: (notificationIds: string[]) => Promise<{
    modifiedCount: number;
}>;
export declare const getNotificationList: (userId: Types.ObjectId, query: INotificationQueryInput) => Promise<{
    notifications: INotification[];
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
}>;
/**
 * Get unread notification count for a user
 */
export declare const notificationGetUnreadCount: (userId: string | Types.ObjectId) => Promise<number>;
/**
 * Delete a notification
 */
export declare const notificationDelete: (notificationId: string | Types.ObjectId) => Promise<INotification | null>;
/**
 * Delete all notifications for a user
 */
export declare const notificationDeleteUserAll: (userId: string | Types.ObjectId) => Promise<{
    deletedCount: number;
}>;
//# sourceMappingURL=notification.service.d.ts.map