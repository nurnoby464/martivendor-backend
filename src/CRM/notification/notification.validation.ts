import { Types } from "mongoose";
import z from "zod";

export const notificationIdParamSchema = z.object({
  notificationId: z
    .string()
    .refine((id) => Types.ObjectId.isValid(id), {
      message: "Invalid notification ID",
    }),
});
