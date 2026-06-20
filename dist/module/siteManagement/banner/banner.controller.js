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
exports.deleteMultipleBanners = exports.bulkUpdateOrders = exports.toggleBannerStatus = exports.deleteBanner = exports.updateBanner = exports.getBannerById = exports.getActiveBanners = exports.getAllBanners = exports.createBanner = void 0;
const BannerService = __importStar(require("../banner/banner.service"));
const asyncHandler_1 = require("../../../utils/asyncHandler");
const ApiResponse_1 = require("../../../utils/ApiResponse");
const appError_1 = require("../../../middlewares/appError");
// Create new banner
exports.createBanner = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const companyId = req.user.company_id;
    if (!companyId) {
        return ApiResponse_1.ApiResponse.error(res, "Failed to create Banner");
    }
    const banner = await BannerService.createBanner(companyId, req.body);
    return ApiResponse_1.ApiResponse.created(res, banner, "Banner created successfully");
});
// Get all banners (admin)
const getAllBanners = async (req, res) => {
    const companyId = req.company?._id;
    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: "Failed to fetch banners",
        });
    }
    try {
        const { active, page, limit, sortBy, sortOrder } = req.query;
        // Build params object only with defined values
        const params = {};
        if (active !== undefined) {
            params.active = active === "true";
        }
        if (page !== undefined) {
            params.page = Number(page);
        }
        if (limit !== undefined) {
            params.limit = Number(limit);
        }
        if (sortBy !== undefined) {
            params.sortBy = sortBy;
        }
        if (sortOrder !== undefined) {
            params.sortOrder = sortOrder;
        }
        const result = await BannerService.getAllBanners(companyId, params);
        return res.status(200).json(result);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch banners",
        });
    }
};
exports.getAllBanners = getAllBanners;
// Get active banners for frontend
exports.getActiveBanners = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const companyId = req.company?._id;
    if (!companyId) {
        return ApiResponse_1.ApiResponse.error(res, "Company id not found");
    }
    const banners = await BannerService.getActiveBanners(companyId);
    return ApiResponse_1.ApiResponse.success(res, { banners, count: banners.length }, "Active banners fetched successfully");
});
// Get single banner
exports.getBannerById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const companyId = req.user.company_id;
    if (!companyId) {
        return ApiResponse_1.ApiResponse.error(res, "Failed to fetch banner");
    }
    const { id } = req.params;
    const banner = await BannerService.getBannerById(id, companyId);
    if (!banner) {
        throw new appError_1.AppError("Banner not found", 404);
    }
    return ApiResponse_1.ApiResponse.success(res, banner, "Banner fetched successfully");
});
// Update banner
exports.updateBanner = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const companyId = req.user.company_id;
    if (!companyId) {
        return ApiResponse_1.ApiResponse.error(res, "Failed to update banner");
    }
    const { id } = req.params;
    const banner = await BannerService.updateBanner(id, companyId, req.body);
    if (!banner) {
        throw new appError_1.AppError("Banner not found", 404);
    }
    return ApiResponse_1.ApiResponse.success(res, banner, "Banner updated successfully");
});
// Delete banner
exports.deleteBanner = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const companyId = req.user.company_id;
    if (!companyId) {
        return ApiResponse_1.ApiResponse.error(res, "Failed to delete banner");
    }
    const { id } = req.params;
    const banner = await BannerService.deleteBanner(id, companyId);
    if (!banner) {
        throw new appError_1.AppError("Banner not found", 404);
    }
    // Note: Cloudinary cleanup should be handled by frontend or separate service
    return ApiResponse_1.ApiResponse.success(res, { imagePublicId: banner.imagePublicId }, "Banner deleted successfully");
});
// Toggle banner status
exports.toggleBannerStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const companyId = req.user.company_id;
    if (!companyId) {
        return ApiResponse_1.ApiResponse.error(res, "Failed to toggle banner status");
    }
    const { id } = req.params;
    const banner = await BannerService.toggleBannerStatus(id, companyId);
    if (!banner) {
        throw new appError_1.AppError("Banner not found", 404);
    }
    return ApiResponse_1.ApiResponse.success(res, banner, `Banner ${banner.active ? "activated" : "deactivated"} successfully`);
});
// Bulk update banner orders
exports.bulkUpdateOrders = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const companyId = req.user.company_id;
    if (!companyId) {
        return ApiResponse_1.ApiResponse.error(res, "Failed to update banner orders");
    }
    const { banners } = req.body;
    await BannerService.bulkUpdateOrders(companyId, banners);
    return ApiResponse_1.ApiResponse.success(res, null, "Banner orders updated successfully");
});
// Delete multiple banners
exports.deleteMultipleBanners = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const companyId = req.user.company_id;
    if (!companyId) {
        return ApiResponse_1.ApiResponse.error(res, "Failed to delete banners");
    }
    const { ids } = req.body;
    const deletedCount = await BannerService.deleteMultipleBanners(companyId, ids);
    return ApiResponse_1.ApiResponse.success(res, { deletedCount }, `${deletedCount} banner(s) deleted successfully`);
});
//# sourceMappingURL=banner.controller.js.map