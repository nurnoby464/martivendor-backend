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
exports.BannerRouter = void 0;
const express_1 = require("express");
const BannerController = __importStar(require("../banner/banner.controller"));
const banner_validation_1 = require("../banner/banner.validation");
const validate_1 = require("../../../middlewares/validate");
const companyIdentifier_1 = require("../../../middlewares/companyIdentifier");
const AuthenticateHelper_1 = require("../../../middlewares/AuthenticateHelper");
const guard_1 = require("../../../middlewares/guard");
const router = (0, express_1.Router)();
// Public routes (no auth required for getting active banners)
router.get("/active", companyIdentifier_1.companyIdentifier, BannerController.getActiveBanners);
// Admin routes (add authentication middleware in production)
router.get("/", (0, validate_1.validate)({ query: banner_validation_1.getBannersQuerySchema }), companyIdentifier_1.companyIdentifier, BannerController.getAllBanners);
router.get("/:id", (0, validate_1.validate)({ params: banner_validation_1.getBannerSchema }), BannerController.getBannerById);
router.post("/", (0, validate_1.validate)({ body: banner_validation_1.createBannerSchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "admin"), BannerController.createBanner);
router.put("/:id", (0, validate_1.validate)({ params: banner_validation_1.BannerParams, body: banner_validation_1.updateBannerSchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "admin"), BannerController.updateBanner);
router.patch("/:id/toggle", (0, validate_1.validate)({ params: banner_validation_1.getBannerSchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "admin"), BannerController.toggleBannerStatus);
router.delete("/:id", (0, validate_1.validate)({ params: banner_validation_1.deleteBannerSchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "admin"), BannerController.deleteBanner);
router.post("/bulk/update-orders", (0, validate_1.validate)({ body: banner_validation_1.bulkUpdateBannersSchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "admin"), BannerController.bulkUpdateOrders);
router.post("/bulk/delete", AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "admin"), BannerController.deleteMultipleBanners);
exports.BannerRouter = router;
//# sourceMappingURL=banner.route.js.map