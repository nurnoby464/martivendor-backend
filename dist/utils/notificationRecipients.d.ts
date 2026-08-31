import { Types } from "mongoose";
import { NotificationType } from "../shared/notifications/constants";
import { NotificationRelatedModel } from "../CRM/notification/notification.interface";
interface NotifyPayload {
    type: NotificationType;
    title: string;
    message: string;
    relatedId?: Types.ObjectId;
    relatedModel?: NotificationRelatedModel;
    data?: Record<string, unknown>;
}
export declare function notifySellerOwner(sellerId: Types.ObjectId, payload: NotifyPayload): Promise<void>;
export declare function notifyPlatformStaff(payload: NotifyPayload): Promise<void>;
export declare function notifySuperAdmins(payload: NotifyPayload): Promise<void>;
export declare function notifyCustomer(customer: {
    userId?: Types.ObjectId;
    sellerId: Types.ObjectId;
}, payload: NotifyPayload): Promise<void>;
export {};
//# sourceMappingURL=notificationRecipients.d.ts.map