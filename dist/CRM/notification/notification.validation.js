"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationMarkMultipleSchema = exports.notificationQuerySchema = exports.notificationIdParamSchema = void 0;
const mongoose_1 = require("mongoose");
const zod_1 = __importDefault(require("zod"));
exports.notificationIdParamSchema = zod_1.default.object({
    notificationId: zod_1.default.string().refine((id) => mongoose_1.Types.ObjectId.isValid(id), {
        message: "Invalid notification ID",
    }),
});
// notification.validation.ts — add this
exports.notificationQuerySchema = zod_1.default.object({
    category: zod_1.default.string().optional(),
    isRead: zod_1.default.enum(["true", "false"]).optional(),
    page: zod_1.default.coerce.number().min(1).default(1),
    limit: zod_1.default.coerce.number().min(1).max(50).default(20),
});
// notification.validation.ts — add
exports.notificationMarkMultipleSchema = zod_1.default.object({
    notificationIds: zod_1.default
        .array(zod_1.default.string().refine((id) => mongoose_1.Types.ObjectId.isValid(id), { message: "Invalid notification ID" }))
        .min(1, "At least one notification ID is required"),
});
//# sourceMappingURL=notification.validation.js.map