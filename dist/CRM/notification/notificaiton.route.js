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
exports.NotificationRouter = void 0;
const express_1 = __importDefault(require("express"));
const NotificationController = __importStar(require("./notification.controller"));
const AuthenticateHelper_1 = require("../../middlewares/AuthenticateHelper");
const validate_1 = require("../../middlewares/validate");
const notification_validation_1 = require("./notification.validation");
const router = express_1.default.Router();
// notification.route.ts — add
router.patch("/:notificationId/read", AuthenticateHelper_1.authenticate, (0, validate_1.validate)({ params: notification_validation_1.notificationIdParamSchema }), NotificationController.notificationMarkAsRead);
router.patch("/read-multiple", AuthenticateHelper_1.authenticate, (0, validate_1.validate)({ body: notification_validation_1.notificationMarkMultipleSchema }), NotificationController.notificationMarkMultipleAsRead);
router.get("/unread-count", AuthenticateHelper_1.authenticate, NotificationController.notificationGetUnreadCount);
router.get("/", (0, validate_1.validate)({ query: notification_validation_1.notificationQuerySchema }), AuthenticateHelper_1.authenticate, NotificationController.getNotificationList);
exports.NotificationRouter = router;
//# sourceMappingURL=notificaiton.route.js.map