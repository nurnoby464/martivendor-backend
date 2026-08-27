import { Schema, model } from "mongoose";

import {
  INotification,
  NotificationRelatedModel,
} from "./notification.interface";

import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_TYPES,
} from "../../shared/notifications/constants";

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },
    audience: {
      type: String,
      enum: ["Seller", "SellerStaff", "Staff", "SuperAdmin", "Customer"],
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES).flatMap(Object.values),
      required: true,
      index: true,
    },

    category: {
      type: String,
      required: true,
      enum: NOTIFICATION_CATEGORIES,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    relatedId: {
      type: Schema.Types.ObjectId,
      required: false,
    },

    relatedModel: {
      type: String,
      enum: [
        "Order",
        "ProductVariant",
        "Payment",
        "User",
        "Sale",
        "Product",
      ] satisfies NotificationRelatedModel[],
      required: false,
    },

    data: {
      type: Schema.Types.Mixed,
      default: undefined,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

notificationSchema.index({ sellerId: 1, audience: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = model<INotification>(
  "Notification",
  notificationSchema,
);
