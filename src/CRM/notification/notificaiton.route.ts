import express from "express";
import * as NotificationController from "./notification.controller";
import { authenticate } from "../../middlewares/AuthenticateHelper";
import { validate } from "../../middlewares/validate";

const router = express.Router();

router.get(
  "/unread",
  authenticate,
  NotificationController.notificationGetUnread,
);
router.get(
  "/unread-count",
  authenticate,
  NotificationController.notificationGetUnreadCount,
);

export const NotificationRouter = router;
