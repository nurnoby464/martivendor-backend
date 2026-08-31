import { Types } from "mongoose";
import { NotificationCategory, NotificationType } from "../../shared/notifications/constants";
export type NotificationRelatedModel = "Order" | "ProductVariant" | "Payment" | "User" | "Sale" | "Product";
export type NotificationAudience = "Seller" | "SellerStaff" | "Staff" | "SuperAdmin" | "Customer";
export interface INotification {
    _id?: Types.ObjectId;
    userId: Types.ObjectId;
    sellerId: Types.ObjectId;
    audience: NotificationAudience;
    type: NotificationType;
    category: NotificationCategory;
    title: string;
    message: string;
    relatedId?: Types.ObjectId;
    relatedModel?: NotificationRelatedModel;
    data?: Record<string, unknown>;
    isRead: boolean;
    readAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateNotificationPayload {
    userId: Types.ObjectId | string;
    sellerId: Types.ObjectId | string;
    audience: INotification["audience"];
    type: NotificationType;
    title: string;
    message: string;
    relatedId?: Types.ObjectId | string;
    relatedModel?: NotificationRelatedModel;
    data?: Record<string, any>;
}
//# sourceMappingURL=notification.interface.d.ts.map