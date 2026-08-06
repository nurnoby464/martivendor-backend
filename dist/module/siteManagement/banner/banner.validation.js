"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUpdateBannersSchema = exports.getBannerSchema = exports.deleteBannerSchema = exports.getBannersQuerySchema = exports.updateBannerSchema = exports.BannerParams = exports.createBannerSchema = void 0;
const zod_1 = require("zod");
// Create Banner Validation
exports.createBannerSchema = zod_1.z
    .object({
    text: zod_1.z
        .string()
        .max(500, "Text cannot exceed 500 characters")
        .optional()
        .nullable(),
    imageUrl: zod_1.z
        .string()
        .url("Please provide a valid image URL")
        .min(1, "Image URL is required"),
    imagePublicId: zod_1.z.string().optional(),
    active: zod_1.z.boolean().default(false),
    order: zod_1.z.number().int().min(0).default(0),
    linkUrl: zod_1.z.string().optional().nullable(),
    startDate: zod_1.z.string().datetime().optional().nullable(),
    endDate: zod_1.z.string().datetime().optional().nullable(),
})
    .refine((data) => {
    if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
    }
    return true;
}, {
    message: "End date must be after start date",
    path: ["endDate"],
});
// Update Banner Validation
exports.BannerParams = zod_1.z.object({
    id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid banner ID format"),
});
exports.updateBannerSchema = zod_1.z
    .object({
    text: zod_1.z.string().max(500).optional().nullable(),
    imageUrl: zod_1.z.string().url().optional(),
    imagePublicId: zod_1.z.string().optional(),
    active: zod_1.z.boolean().optional(),
    order: zod_1.z.number().int().min(0).optional(),
    linkUrl: zod_1.z.string().optional().nullable(),
    startDate: zod_1.z.string().datetime().optional().nullable(),
    endDate: zod_1.z.string().datetime().optional().nullable(),
})
    .refine((data) => {
    if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
    }
    return true;
}, {
    message: "End date must be after start date",
    path: ["endDate"],
});
// Get Banners Query Validation
exports.getBannersQuerySchema = zod_1.z.object({
    active: zod_1.z.enum(["true", "false"]).optional(),
    page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    sortBy: zod_1.z.enum(["createdAt", "order", "updatedAt"]).default("order"),
    sortOrder: zod_1.z.enum(["asc", "desc"]).default("asc"),
});
// Delete Banner Validation
exports.deleteBannerSchema = zod_1.z.object({
    id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid banner ID format"),
});
// Get Single Banner Validation
exports.getBannerSchema = zod_1.z.object({
    id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid banner ID format"),
});
// Bulk Update Validation (for reordering)
exports.bulkUpdateBannersSchema = zod_1.z.object({
    banners: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/),
        order: zod_1.z.number().int().min(0),
        active: zod_1.z.boolean().optional(),
    })),
});
//# sourceMappingURL=banner.validation.js.map