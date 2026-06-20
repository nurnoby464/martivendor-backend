import {
  IBanner,
  IBannerDocument,
  IBannerQueryParams,
} from "../banner/banner.interface";
import { Types } from "mongoose";
import { Banner } from "./banner.schems";

// Create new banner
export const createBanner = async (
  companyId: Types.ObjectId,
  bannerData: Partial<IBanner>,
): Promise<IBannerDocument> => {
  const banner = await Banner.create({
    companyId,
    ...bannerData,
  });
  return banner;
};

// Get all banners with pagination and filtering
export const getAllBanners = async (
  companyId: Types.ObjectId,
  params: IBannerQueryParams,
) => {
  const {
    active,
    page = 1,
    limit = 10,
    sortBy = "order",
    sortOrder = "asc",
  } = params;

  const skip = (page - 1) * limit;
  const sort: Record<string, 1 | -1> = {
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };

  // Build query — companyId first, always
  const query: any = { companyId };
  if (active !== undefined) {
    query.active = active === true;
  }

  // Execute queries in parallel
  const [banners, total] = await Promise.all([
    Banner.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Banner.countDocuments(query),
  ]);

  return {
    success: true,
    data: banners,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get active banners for frontend display
export const getActiveBanners = async (
  companyId: Types.ObjectId,
): Promise<IBannerDocument[]> => {
  const now = new Date();

  const banners = await Banner.find({
    companyId,
    active: true,
    $and: [
      {
        $or: [{ startDate: { $lte: now } }, { startDate: null }],
      },
      {
        $or: [{ endDate: { $gte: now } }, { endDate: null }],
      },
    ],
  })
    .sort({ order: 1, createdAt: -1 })
    .lean();

  return banners;
};

// Get single banner by ID
export const getBannerById = async (
  id: string,
  companyId: Types.ObjectId,
): Promise<IBannerDocument | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error("Invalid banner ID");
  }

  return await Banner.findOne({ _id: id, companyId }).lean();
};

// Update banner
export const updateBanner = async (
  id: string,
  companyId: Types.ObjectId,
  updateData: Partial<IBanner>,
): Promise<IBannerDocument | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error("Invalid banner ID");
  }

  const banner = await Banner.findOneAndUpdate(
    { _id: id, companyId },
    { $set: updateData },
    { new: true, runValidators: true },
  ).lean();

  return banner;
};

// Delete banner
export const deleteBanner = async (
  id: string,
  companyId: Types.ObjectId,
): Promise<IBannerDocument | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error("Invalid banner ID");
  }

  const banner = await Banner.findOneAndDelete({ _id: id, companyId }).lean();

  // Return the banner data so controller can handle Cloudinary cleanup
  return banner;
};

// Bulk update banner orders
export const bulkUpdateOrders = async (
  companyId: Types.ObjectId,
  updates: Array<{ id: string; order: number; active?: boolean }>,
): Promise<void> => {
  const bulkOps = updates
    .filter(({ id }) => Types.ObjectId.isValid(id))
    .map(({ id, order, active }) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(id), companyId },
        update: { $set: { order, ...(active !== undefined && { active }) } },
      },
    }));

  await Banner.bulkWrite(bulkOps);
};

// Toggle banner active status
export const toggleBannerStatus = async (
  id: string,
  companyId: Types.ObjectId,
): Promise<IBannerDocument | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error("Invalid banner ID");
  }

  const banner = await Banner.findOne({ _id: id, companyId });
  if (!banner) return null;

  banner.active = !banner.active;
  await banner.save();

  return banner.toJSON();
};

// Delete multiple banners
export const deleteMultipleBanners = async (
  companyId: Types.ObjectId,
  ids: string[],
): Promise<number> => {
  const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
  const result = await Banner.deleteMany({
    _id: { $in: validIds },
    companyId,
  });

  return result.deletedCount;
};
