import { Request, Response } from "express";
import * as BannerService from "../banner/banner.service";
import { IBannerQueryParams } from "./banner.interface";
import { asyncHandler } from "../../../utils/asyncHandler";
import { ApiResponse } from "../../../utils/ApiResponse";
import { AppError } from "../../../middlewares/appError";

// Create new banner
export const createBanner = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = req.user.sellerId;
    if (!sellerId) {
      return ApiResponse.error(res, "Failed to create Banner");
    }
    const banner = await BannerService.createBanner(sellerId, req.body);
    return ApiResponse.created(res, banner, "Banner created successfully");
  },
);

// Get all banners (admin)
export const getAllBanners = async (req: Request, res: Response) => {
  const sellerId = req.company?._id;
  if (!sellerId) {
    return res.status(400).json({
      success: false,
      message: "Failed to fetch banners",
    });
  }
  try {
    const { active, page, limit, sortBy, sortOrder } = req.query;

    // Build params object only with defined values
    const params: IBannerQueryParams = {};

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
      params.sortBy = sortBy as string;
    }

    if (sortOrder !== undefined) {
      params.sortOrder = sortOrder as "asc" | "desc";
    }

    const result = await BannerService.getAllBanners(sellerId, params);

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch banners",
    });
  }
};

// Get active banners for frontend
export const getActiveBanners = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = req.company?._id;
    if (!sellerId) {
      return ApiResponse.error(res, "Company id not found");
    }

    const banners = await BannerService.getActiveBanners(sellerId);

    return ApiResponse.success(
      res,
      { banners, count: banners.length },
      "Active banners fetched successfully",
    );
  },
);

// Get single banner
export const getBannerById = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = req.user.sellerId;
    if (!sellerId) {
      return ApiResponse.error(res, "Failed to fetch banner");
    }
    const { id } = req.params;
    const banner = await BannerService.getBannerById(id as string, sellerId);

    if (!banner) {
      throw new AppError("Banner not found", 404);
    }

    return ApiResponse.success(res, banner, "Banner fetched successfully");
  },
);

// Update banner
export const updateBanner = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = req.user.sellerId;
    if (!sellerId) {
      return ApiResponse.error(res, "Failed to update banner");
    }
    const { id } = req.params;
    const banner = await BannerService.updateBanner(
      id as string,
      sellerId,
      req.body,
    );

    if (!banner) {
      throw new AppError("Banner not found", 404);
    }

    return ApiResponse.success(res, banner, "Banner updated successfully");
  },
);

// Delete banner
export const deleteBanner = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = req.user.sellerId;
    if (!sellerId) {
      return ApiResponse.error(res, "Failed to delete banner");
    }
    const { id } = req.params;
    const banner = await BannerService.deleteBanner(id as string, sellerId);

    if (!banner) {
      throw new AppError("Banner not found", 404);
    }

    // Note: Cloudinary cleanup should be handled by frontend or separate service
    return ApiResponse.success(
      res,
      { imagePublicId: banner.imagePublicId },
      "Banner deleted successfully",
    );
  },
);

// Toggle banner status
export const toggleBannerStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = req.user.sellerId;
    if (!sellerId) {
      return ApiResponse.error(res, "Failed to toggle banner status");
    }
    const { id } = req.params;
    const banner = await BannerService.toggleBannerStatus(
      id as string,
      sellerId,
    );

    if (!banner) {
      throw new AppError("Banner not found", 404);
    }

    return ApiResponse.success(
      res,
      banner,
      `Banner ${banner.active ? "activated" : "deactivated"} successfully`,
    );
  },
);

// Bulk update banner orders
export const bulkUpdateOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = req.user.sellerId;
    if (!sellerId) {
      return ApiResponse.error(res, "Failed to update banner orders");
    }
    const { banners } = req.body;
    await BannerService.bulkUpdateOrders(sellerId, banners);

    return ApiResponse.success(res, null, "Banner orders updated successfully");
  },
);

// Delete multiple banners
export const deleteMultipleBanners = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = req.user.sellerId;
    if (!sellerId) {
      return ApiResponse.error(res, "Failed to delete banners");
    }
    const { ids } = req.body;
    const deletedCount = await BannerService.deleteMultipleBanners(
      sellerId,
      ids,
    );

    return ApiResponse.success(
      res,
      { deletedCount },
      `${deletedCount} banner(s) deleted successfully`,
    );
  },
);
