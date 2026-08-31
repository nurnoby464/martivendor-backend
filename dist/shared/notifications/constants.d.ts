export declare const NOTIFICATION_CATEGORIES: readonly ["order", "payment", "delivery", "seller", "staff", "product", "inventory", "support", "account", "system"];
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];
export declare const NOTIFICATION_TYPES: {
    readonly ORDER: {
        readonly CREATED: "order.created";
        readonly CONFIRMED: "order.confirmed";
        readonly CANCELLED: "order.cancelled";
        readonly SHIPPED: "order.shipped";
        readonly DELIVERED: "order.delivered";
        readonly RETURNED: "order.returned";
        readonly REFUNDED: "order.refunded";
    };
    readonly PAYMENT: {
        readonly SUCCESS: "payment.success";
        readonly FAILED: "payment.failed";
        readonly PENDING: "payment.pending";
        readonly REFUNDED: "payment.refunded";
    };
    readonly SELLER: {
        readonly APPLICATION_SUBMITTED: "seller.application_submitted";
        readonly APPLICATION_APPROVED: "seller.application_approved";
        readonly APPLICATION_REJECTED: "seller.application_rejected";
        readonly VERIFICATION_REQUIRED: "seller.verification_required";
        readonly SUSPENDED: "seller.suspended";
        readonly REACTIVATED: "seller.reactivated";
    };
    readonly STAFF: {
        readonly INVITED: "staff.invited";
        readonly APPROVED: "staff.approved";
        readonly REJECTED: "staff.rejected";
        readonly ROLE_CHANGED: "staff.role_changed";
        readonly REMOVED: "staff.removed";
        readonly PERMISSION_CHANGED: "staff.permission_changed";
    };
    readonly PRODUCT: {
        readonly APPROVED: "product.approved";
        readonly REJECTED: "product.rejected";
        readonly REVIEW_REQUIRED: "product.review_required";
        readonly DEACTIVATED: "product.deactivated";
    };
    readonly INVENTORY: {
        readonly LOW_STOCK: "inventory.low_stock";
        readonly OUT_OF_STOCK: "inventory.out_of_stock";
        readonly BACK_IN_STOCK: "inventory.back_in_stock";
    };
    readonly SUPPORT: {
        readonly CREATED: "support.created";
        readonly ASSIGNED: "support.assigned";
        readonly REPLIED: "support.replied";
        readonly RESOLVED: "support.resolved";
    };
    readonly ACCOUNT: {
        readonly PASSWORD_CHANGED: "account.password_changed";
        readonly EMAIL_CHANGED: "account.email_changed";
        readonly SECURITY_ALERT: "account.security_alert";
        readonly STATUS_CHANGED: "account.status_changed";
    };
};
export type NotificationType = {
    [K in keyof typeof NOTIFICATION_TYPES]: (typeof NOTIFICATION_TYPES)[K][keyof (typeof NOTIFICATION_TYPES)[K]];
}[keyof typeof NOTIFICATION_TYPES];
export declare const NOTIFICATION_TYPE_VALUES: ("order.created" | "order.confirmed" | "order.cancelled" | "order.shipped" | "order.delivered" | "order.returned" | "order.refunded" | "payment.success" | "payment.failed" | "payment.pending" | "payment.refunded" | "seller.application_submitted" | "seller.application_approved" | "seller.application_rejected" | "seller.verification_required" | "seller.suspended" | "seller.reactivated" | "staff.invited" | "staff.approved" | "staff.rejected" | "staff.role_changed" | "staff.removed" | "staff.permission_changed" | "product.approved" | "product.rejected" | "product.review_required" | "product.deactivated" | "inventory.low_stock" | "inventory.out_of_stock" | "inventory.back_in_stock" | "support.created" | "support.assigned" | "support.replied" | "support.resolved" | "account.password_changed" | "account.email_changed" | "account.security_alert" | "account.status_changed")[];
export declare const getCategoryFromType: (type: NotificationType) => NotificationCategory;
//# sourceMappingURL=constants.d.ts.map