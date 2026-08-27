import { Types } from "mongoose";
import { Seller } from "../module/seller/seller.schema";
import * as NotificationServices from "../CRM/notification/notification.service"
import { SellerStaff } from "../CRM/sellerStaff/sellerStaff.schema";
import User from "../module/user/user.schema";
import { NotificationType } from "../shared/notifications/constants";
import { NotificationRelatedModel } from "../CRM/notification/notification.interface";

// helpers/notificationRecipients.ts
interface NotifyPayload {
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: Types.ObjectId;
  relatedModel?: NotificationRelatedModel;
  data?: Record<string, unknown>;
}

// The vendor owner — exactly one recipient
export async function notifySellerOwner(sellerId: Types.ObjectId, payload: NotifyPayload) {
  const seller = await Seller.findById(sellerId).select("userId").lean();
  if (!seller?.userId) return;

  await NotificationServices.create({
    userId: seller.userId as Types.ObjectId,
    sellerId,
    audience: "Seller",
    ...payload,
  });
}

// Staff hired by that specific vendor — filtered by permission, not just "all staff"
// export async function notifySellerStaff(
//   sellerId: Types.ObjectId,
//   permission: string,
//   payload: NotifyPayload,
// ) {
//   const staffProfiles = await SellerStaff.find({
//     sellerId,
//     status: "active",
//     permissions: permission,
//   }).select("userId").lean();

//   await Promise.all(
//     staffProfiles.map((s) =>
//       NotificationServices.create({
//         userId: s.userId as Types.ObjectId,
//         sellerId,
//         audience: "SellerStaff",
//         ...payload,
//       }),
//     ),
//   );
// }

// Platform team — sellerId is the ONE isPlatform:true Seller doc
export async function notifyPlatformStaff(payload: NotifyPayload) {
  const platformSeller = await Seller.findOne({ isPlatform: true }).select("_id").lean();
  if (!platformSeller) return;

  const staff = await User.find({
    sellerId: platformSeller._id,
    role: { $in: ["admin", "staff", "site_management", "inventory", "sales", "report", "account"] },
    isActive: true,
  }).select("_id").lean();

  await Promise.all(
    staff.map((u) =>
      NotificationServices.create({
        userId: u._id as Types.ObjectId,
        sellerId: platformSeller._id,
        audience: "Staff",
        ...payload,
      }),
    ),
  );
}

export async function notifySuperAdmins(payload: NotifyPayload) {
  const admins = await User.find({ role: "super_admin" }).select("_id sellerId").lean();
  await Promise.all(
    admins.map((u) =>
      NotificationServices.create({
        userId: u._id as Types.ObjectId,
        sellerId: u.sellerId as Types.ObjectId, // their own sellerId (platform seller)
        audience: "SuperAdmin",
        ...payload,
      }),
    ),
  );
}

// Customer — only if they have a real login (userId not null)
export async function notifyCustomer(customer: { userId?: Types.ObjectId; sellerId: Types.ObjectId }, payload: NotifyPayload) {
  if (!customer.userId) return; // guest/no-account customer — email/SMS only, skip in-app
  await NotificationServices.create({
    userId: customer.userId,
    sellerId: customer.sellerId,
    audience: "Customer",
    ...payload,
  });
}