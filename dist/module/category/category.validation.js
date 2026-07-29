"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryQuerySchema = exports.categoryParamsSchema = exports.updateCategorySchema = exports.createCategorySchema = void 0;
// src/module/category/category.validation.ts
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
const objectId = zod_1.z
    .string()
    .refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
});
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .trim()
        .min(2, "Min 2 characters")
        .max(100, "Max 100 characters"),
    parentId: objectId.optional().nullable(),
    isActive: zod_1.z.boolean(),
    image: zod_1.z.string().trim().url("Invalid image URL").optional().nullable(),
});
exports.updateCategorySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(100).optional(),
    image: zod_1.z.string().trim().url().optional().nullable(),
    is_active: zod_1.z.boolean().optional(),
});
exports.categoryParamsSchema = zod_1.z.object({
    id: objectId,
});
exports.categoryQuerySchema = zod_1.z.object({
    page: zod_1.z
        .string()
        .optional()
        .transform((v) => parseInt(v ?? "1")),
    limit: zod_1.z
        .string()
        .optional()
        .transform((v) => parseInt(v ?? "10")),
    search: zod_1.z.string().trim().optional(),
    parent_id: zod_1.z
        .string()
        .optional()
        .transform((v) => {
        if (v === undefined)
            return undefined;
        if (v === "null")
            return null;
        if (!mongoose_1.default.Types.ObjectId.isValid(v))
            throw new Error("Invalid ObjectId");
        return v;
    }),
    depth: zod_1.z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v) : undefined)),
    is_active: zod_1.z
        .enum(["true", "false"])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === "true")),
});
//# sourceMappingURL=category.validation.js.map