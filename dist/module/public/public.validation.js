"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productQuerySchema = exports.productParamsSchema = void 0;
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
const product_interface_1 = require("../product/product.interface");
const objectId = zod_1.z
    .string()
    .refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
});
exports.productParamsSchema = zod_1.z.object({
    id: objectId,
});
exports.productQuerySchema = zod_1.z.object({
    page: zod_1.z
        .string()
        .optional()
        .transform((v) => parseInt(v ?? "1")),
    limit: zod_1.z
        .string()
        .optional()
        .transform((v) => parseInt(v ?? "10")),
    search: zod_1.z.string().trim().optional(),
    productType: zod_1.z.enum(product_interface_1.ProductType).optional(),
    categoryId: objectId.optional(),
    // vendor_id: objectId.optional(),
    hasVariants: zod_1.z
        .enum(["true", "false"])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === "true")),
    isActive: zod_1.z
        .enum(["true", "false"])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === "true")),
    lowStock: zod_1.z.enum(["true"]).optional(), // ?low_stock=true → filter stock <= alert
    sortBy: zod_1.z
        .enum(["name", "createdAt", "stock", "sellingPrice", "updatedAt"])
        .optional()
        .default("createdAt"),
    sortOrder: zod_1.z.enum(["asc", "desc"]).optional().default("desc"),
    tags: zod_1.z
        .union([zod_1.z.enum(product_interface_1.ProductTag), zod_1.z.array(zod_1.z.enum(product_interface_1.ProductTag)).max(10)])
        .transform((v) => (Array.isArray(v) ? v : [v]))
        .optional(),
    discount: zod_1.z.coerce.number().min(0).max(100).optional(),
    hasDiscount: zod_1.z
        .enum(["true", "false"])
        .transform((v) => (v === "true" ? true : false))
        .optional(),
});
//# sourceMappingURL=public.validation.js.map