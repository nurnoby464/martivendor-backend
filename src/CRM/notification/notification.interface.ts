import { Types } from "mongoose";

import {
  NotificationCategory,
  NotificationType,
} from "../../shared/notifications/constants";

export type NotificationRelatedModel =
  | "Order"
  | "ProductVariant"
  | "Payment"
  | "User"
  | "Sale"
  | "Product";

export interface INotification {
  _id?: Types.ObjectId;

  userId: Types.ObjectId;

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