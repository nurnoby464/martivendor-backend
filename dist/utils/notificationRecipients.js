"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifySellerOwner = notifySellerOwner;
exports.notifyPlatformStaff = notifyPlatformStaff;
exports.notifySuperAdmins = notifySuperAdmins;
exports.notifyCustomer = notifyCustomer;
const seller_schema_1 = require("../module/seller/seller.schema");
const NotificationServices = __importStar(require("../CRM/notification/notification.service"));
const user_schema_1 = __importDefault(require("../module/user/user.schema"));
// The vendor owner — exactly one recipient
async function notifySellerOwner(sellerId, payload) {
    const seller = await seller_schema_1.Seller.findById(sellerId).select("userId").lean();
    if (!seller?.userId)
        return;
    await NotificationServices.create({
        userId: seller.userId,
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
async function notifyPlatformStaff(payload) {
    const platformSeller = await seller_schema_1.Seller.findOne({ isPlatform: true }).select("_id").lean();
    if (!platformSeller)
        return;
    const staff = await user_schema_1.default.find({
        sellerId: platformSeller._id,
        role: { $in: ["admin", "staff", "site_management", "inventory", "sales", "report", "account"] },
        isActive: true,
    }).select("_id").lean();
    await Promise.all(staff.map((u) => NotificationServices.create({
        userId: u._id,
        sellerId: platformSeller._id,
        audience: "Staff",
        ...payload,
    })));
}
async function notifySuperAdmins(payload) {
    const admins = await user_schema_1.default.find({ role: "super_admin" }).select("_id sellerId").lean();
    await Promise.all(admins.map((u) => NotificationServices.create({
        userId: u._id,
        sellerId: u.sellerId, // their own sellerId (platform seller)
        audience: "SuperAdmin",
        ...payload,
    })));
}
// Customer — only if they have a real login (userId not null)
async function notifyCustomer(customer, payload) {
    if (!customer.userId)
        return; // guest/no-account customer — email/SMS only, skip in-app
    await NotificationServices.create({
        userId: customer.userId,
        sellerId: customer.sellerId,
        audience: "Customer",
        ...payload,
    });
}
//# sourceMappingURL=notificationRecipients.js.map