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
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationMarkMultipleAsRead = exports.notificationMarkAsRead = exports.notificationGetUnreadCount = exports.getNotificationList = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const NotificationServices = __importStar(require("./notification.service"));
const ApiResponse_1 = require("../../utils/ApiResponse");
const appError_1 = require("../../middlewares/appError");
exports.getNotificationList = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user._id;
    if (!userId)
        throw new appError_1.AppError("Unauthorized access", 403);
    const { notifications, total, unreadCount, page, limit } = await NotificationServices.getNotificationList(userId, req.validatedQuery);
    return ApiResponse_1.ApiResponse.paginated(res, "Unread notification fetched successfully", notifications, total, page, limit, { unreadCount });
});
exports.notificationGetUnreadCount = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user._id;
    const result = await NotificationServices.notificationGetUnreadCount(userId);
    return ApiResponse_1.ApiResponse.success(res, result, "Unread notification count fetched successfully");
});
// notification.controller.ts — add
exports.notificationMarkAsRead = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const notificationId = req.params.notificationId;
    const result = await NotificationServices.notificationMarkAsRead(notificationId);
    if (!result)
        throw new appError_1.AppError("Notification not found", 404);
    return ApiResponse_1.ApiResponse.success(res, result, "Notification marked as read");
});
exports.notificationMarkMultipleAsRead = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { notificationIds } = req.body;
    const result = await NotificationServices.notificationMarkMultipleAsRead(notificationIds);
    return ApiResponse_1.ApiResponse.success(res, result, "Notifications marked as read");
});
//# sourceMappingURL=notification.controller.js.map