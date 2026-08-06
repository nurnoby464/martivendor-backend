"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMultipleBanners = exports.toggleBannerStatus = exports.bulkUpdateOrders = exports.deleteBanner = exports.updateBanner = exports.getBannerById = exports.getActiveBanners = exports.getAllBanners = exports.createBanner = void 0;
const mongoose_1 = require("mongoose");
const banner_schems_1 = require("./banner.schems");
// Create new banner
const createBanner = async (companyId, bannerData) => {
    const banner = await banner_schems_1.Banner.create({
        companyId,
        ...bannerData,
    });
    return banner;
};
exports.createBanner = createBanner;
// Get all banners with pagination and filtering
const getAllBanners = async (companyId, params) => {
    const { active, page = 1, limit = 10, sortBy = "order", sortOrder = "asc", } = params;
    const skip = (page - 1) * limit;
    const sort = {
        [sortBy]: sortOrder === "asc" ? 1 : -1,
    };
    // Build query — companyId first, always
    const query = { companyId };
    if (active !== undefined) {
        query.active = active === true;
    }
    // Execute queries in parallel
    const [banners, total] = await Promise.all([
        banner_schems_1.Banner.find(query).sort(sort).skip(skip).limit(limit).lean(),
        banner_schems_1.Banner.countDocuments(query),
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
exports.getAllBanners = getAllBanners;
// Get active banners for frontend display
const getActiveBanners = async (companyId) => {
    const now = new Date();
    const banners = await banner_schems_1.Banner.find({
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
exports.getActiveBanners = getActiveBanners;
// Get single banner by ID
const getBannerById = async (id, companyId) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid banner ID");
    }
    return await banner_schems_1.Banner.findOne({ _id: id, companyId }).lean();
};
exports.getBannerById = getBannerById;
// Update banner
const updateBanner = async (id, companyId, updateData) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid banner ID");
    }
    const banner = await banner_schems_1.Banner.findOneAndUpdate({ _id: id, companyId }, { $set: updateData }, { new: true, runValidators: true }).lean();
    return banner;
};
exports.updateBanner = updateBanner;
// Delete banner
const deleteBanner = async (id, companyId) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid banner ID");
    }
    const banner = await banner_schems_1.Banner.findOneAndDelete({ _id: id, companyId }).lean();
    // Return the banner data so controller can handle Cloudinary cleanup
    return banner;
};
exports.deleteBanner = deleteBanner;
// Bulk update banner orders
const bulkUpdateOrders = async (companyId, updates) => {
    const bulkOps = updates
        .filter(({ id }) => mongoose_1.Types.ObjectId.isValid(id))
        .map(({ id, order, active }) => ({
        updateOne: {
            filter: { _id: new mongoose_1.Types.ObjectId(id), companyId },
            update: { $set: { order, ...(active !== undefined && { active }) } },
        },
    }));
    await banner_schems_1.Banner.bulkWrite(bulkOps);
};
exports.bulkUpdateOrders = bulkUpdateOrders;
// Toggle banner active status
const toggleBannerStatus = async (id, companyId) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid banner ID");
    }
    const banner = await banner_schems_1.Banner.findOne({ _id: id, companyId });
    if (!banner)
        return null;
    banner.active = !banner.active;
    await banner.save();
    return banner.toJSON();
};
exports.toggleBannerStatus = toggleBannerStatus;
// Delete multiple banners
const deleteMultipleBanners = async (companyId, ids) => {
    const validIds = ids.filter((id) => mongoose_1.Types.ObjectId.isValid(id));
    const result = await banner_schems_1.Banner.deleteMany({
        _id: { $in: validIds },
        companyId,
    });
    return result.deletedCount;
};
exports.deleteMultipleBanners = deleteMultipleBanners;
//# sourceMappingURL=banner.service.js.map