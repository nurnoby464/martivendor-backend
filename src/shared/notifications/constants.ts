export const NOTIFICATION_CATEGORIES = [
  "order",
  "payment",
  "delivery",
  "seller",
  "staff",
  "product",
  "inventory",
  "support",
  "account",
  "system",
] as const;

export type NotificationCategory =
  (typeof NOTIFICATION_CATEGORIES)[number];

export const NOTIFICATION_TYPES = {
  ORDER: {
    CREATED: "order.created",
    CONFIRMED: "order.confirmed",
    CANCELLED: "order.cancelled",
    SHIPPED: "order.shipped",
    DELIVERED: "order.delivered",
    RETURNED: "order.returned",
    REFUNDED: "order.refunded",
  },

  PAYMENT: {
    SUCCESS: "payment.success",
    FAILED: "payment.failed",
    PENDING: "payment.pending",
    REFUNDED: "payment.refunded",
  },

  SELLER: {
    APPLICATION_SUBMITTED: "seller.application_submitted",
    APPLICATION_APPROVED: "seller.application_approved",
    APPLICATION_REJECTED: "seller.application_rejected",
    VERIFICATION_REQUIRED: "seller.verification_required",
    SUSPENDED: "seller.suspended",
    REACTIVATED: "seller.reactivated",
  },

  STAFF: {
    INVITED: "staff.invited",
    APPROVED: "staff.approved",
    REJECTED: "staff.rejected",
    ROLE_CHANGED: "staff.role_changed",
    REMOVED: "staff.removed",
    PERMISSION_CHANGED: "staff.permission_changed",
  },

  PRODUCT: {
    APPROVED: "product.approved",
    REJECTED: "product.rejected",
    REVIEW_REQUIRED: "product.review_required",
    DEACTIVATED: "product.deactivated",
  },

  INVENTORY: {
    LOW_STOCK: "inventory.low_stock",
    OUT_OF_STOCK: "inventory.out_of_stock",
    BACK_IN_STOCK: "inventory.back_in_stock",
  },

  SUPPORT: {
    CREATED: "support.created",
    ASSIGNED: "support.assigned",
    REPLIED: "support.replied",
    RESOLVED: "support.resolved",
  },

  ACCOUNT: {
    PASSWORD_CHANGED: "account.password_changed",
    EMAIL_CHANGED: "account.email_changed",
    SECURITY_ALERT: "account.security_alert",
    STATUS_CHANGED: "account.status_changed",
  },
} as const;

export type NotificationType = {
  [K in keyof typeof NOTIFICATION_TYPES]:
    (typeof NOTIFICATION_TYPES)[K][keyof (typeof NOTIFICATION_TYPES)[K]]
}[keyof typeof NOTIFICATION_TYPES];

export const NOTIFICATION_TYPE_VALUES = Object.values(
  NOTIFICATION_TYPES,
).flatMap((group) => Object.values(group));

export const getCategoryFromType = (
  type: NotificationType
): NotificationCategory => {
  const category = type.split(".")[0] as NotificationCategory;
  return category;
};