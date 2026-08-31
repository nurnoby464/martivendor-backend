"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const constants_1 = require("../../shared/notifications/constants");
const notificationSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    sellerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Seller",
        required: true,
        index: true,
    },
    audience: {
        type: String,
        enum: ["Seller", "SellerStaff", "Staff", "SuperAdmin", "Customer"],
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: Object.values(constants_1.NOTIFICATION_TYPES).flatMap(Object.values),
        required: true,
        index: true,
    },
    category: {
        type: String,
        required: true,
        enum: constants_1.NOTIFICATION_CATEGORIES,
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    relatedId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: false,
    },
    relatedModel: {
        type: String,
        enum: [
            "Order",
            "ProductVariant",
            "Payment",
            "User",
            "Sale",
            "Product",
        ],
        required: false,
    },
    data: {
        type: mongoose_1.Schema.Types.Mixed,
        default: undefined,
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true,
    },
    readAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
    versionKey: false,
});
notificationSchema.index({ sellerId: 1, audience: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
exports.Notification = (0, mongoose_1.model)("Notification", notificationSchema);
//# sourceMappingURL=notification.schema.js.map