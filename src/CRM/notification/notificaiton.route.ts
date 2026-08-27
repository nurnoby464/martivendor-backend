import express from "express";
import * as NotificationController from "./notification.controller";
import { authenticate } from "../../middlewares/AuthenticateHelper";
import { validate } from "../../middlewares/validate";
import { notificationIdParamSchema, notificationMarkMultipleSchema, notificationQuerySchema } from "./notification.validation";

const router = express.Router();
// notification.route.ts — add
router.patch(
  "/:notificationId/read",
  authenticate,
  validate({ params: notificationIdParamSchema }),
  NotificationController.notificationMarkAsRead,
);

router.patch(
  "/read-multiple",
  authenticate,
  validate({ body: notificationMarkMultipleSchema }),
  NotificationController.notificationMarkMultipleAsRead,
);
router.get(
  "/unread-count",
  authenticate,
  NotificationController.notificationGetUnreadCount,
);
router.get(
  "/",
  validate({ query: notificationQuerySchema }),
  authenticate,
  NotificationController.getNotificationList,
);

export const NotificationRouter = router;
