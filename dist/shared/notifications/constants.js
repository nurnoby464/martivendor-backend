"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoryFromType = exports.NOTIFICATION_TYPE_VALUES = exports.NOTIFICATION_TYPES = exports.NOTIFICATION_CATEGORIES = void 0;
exports.NOTIFICATION_CATEGORIES = [
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
];
exports.NOTIFICATION_TYPES = {
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
};
exports.NOTIFICATION_TYPE_VALUES = Object.values(exports.NOTIFICATION_TYPES).flatMap((group) => Object.values(group));
const getCategoryFromType = (type) => {
    const category = type.split(".")[0];
    return category;
};
exports.getCategoryFromType = getCategoryFromType;
//# sourceMappingURL=constants.js.map