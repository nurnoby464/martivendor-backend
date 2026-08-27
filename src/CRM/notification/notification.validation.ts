import { Types } from "mongoose";
import z from "zod";

export const notificationIdParamSchema = z.object({
  notificationId: z.string().refine((id) => Types.ObjectId.isValid(id), {
    message: "Invalid notification ID",
  }),
});

// notification.validation.ts — add this
export const notificationQuerySchema = z.object({
  category: z.string().optional(),
  isRead: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

// notification.validation.ts — add
export const notificationMarkMultipleSchema = z.object({
  notificationIds: z
    .array(z.string().refine((id) => Types.ObjectId.isValid(id), { message: "Invalid notification ID" }))
    .min(1, "At least one notification ID is required"),
});

export type INotificationMarkMultipleInput = z.infer<typeof notificationMarkMultipleSchema>;
export type INotificationQueryInput = z.infer<typeof notificationQuerySchema>;
