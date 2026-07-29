"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductSchema = exports.productQuerySchema = exports.productSlugParamsSchema = exports.productParamsSchema = exports.updateProductSchema = void 0;
// src/module/product/product.validation.ts
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
const product_interface_1 = require("./product.interface");
const objectId = zod_1.z
    .string()
    .refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
});
const attributeSchema = zod_1.z.object({
    key: zod_1.z.string().trim().min(1, "Attribute key is required"),
    value: zod_1.z.string().trim().min(1, "Attribute value is required"),
});
exports.updateProductSchema = zod_1.z.object({
    // category_id   : objectId.optional(),
    // vendor_id     : objectId.optional(),
    name: zod_1.z.string().trim().min(2).max(200).optional(),
    description: zod_1.z.string().trim().optional().nullable(),
    images: zod_1.z.array(zod_1.z.string().trim().url()).optional(),
    buyingPrice: zod_1.z.number().min(0).optional(),
    sellingPrice: zod_1.z.number().min(0).optional(),
    stock: zod_1.z.number().min(0).optional(),
    lowStockAlert: zod_1.z.number().min(0).optional(),
    isActive: zod_1.z.boolean().optional(),
});
// ─── Variant ──────────────────────────────────────────────
// ─── Params ───────────────────────────────────────────────
exports.productParamsSchema = zod_1.z.object({
    id: objectId,
});
exports.productSlugParamsSchema = zod_1.z.object({
    slug: zod_1.z.string().toLowerCase().trim(),
});
// ─── Query ────────────────────────────────────────────────
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
    categoryId: objectId.optional(),
    vendor_id: objectId.optional(),
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
        .enum(["name", "createdAt", "stock", "selling_price"])
        .optional()
        .default("createdAt"),
    sortOrder: zod_1.z.enum(["asc", "desc"]).optional().default("desc"),
});
const mongoIdField = (label) => zod_1.z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((v) => mongoose_1.default.Types.ObjectId.isValid(v), `Invalid ${label}`);
exports.createProductSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(200, "Name cannot exceed 200 characters"),
    productId: zod_1.z.string().optional(),
    // Wire field is `category` (matches CategoryCombobox's hidden input name).
    categoryId: mongoIdField("Category"),
    // Sent alongside `category` for display purposes only — the product is
    // normalized against the id, never this string. Not persisted.
    categoryName: zod_1.z.string().trim().optional(),
    color: zod_1.z.string().trim().min(1, "Color is required"),
    size: zod_1.z.string().trim().optional().default(""),
    sellingPrice: zod_1.z.coerce.number({ error: "Selling price is required" }).min(0),
    buyingPrice: zod_1.z.coerce.number().min(0).optional().default(0),
    discount: zod_1.z.coerce.number().min(0).max(100).optional().default(0),
    stock: zod_1.z.coerce.number().int().min(0, "Stock cannot be negative"),
    lowStockAlert: zod_1.z.coerce.number().int().min(0).optional().default(5),
    description: zod_1.z.string().trim().max(5000).optional().default(""),
    specifications: zod_1.z.string().trim().max(5000).optional().default(""),
    tags: zod_1.z
        .array(zod_1.z.nativeEnum(product_interface_1.ProductTag))
        .max(10, "Maximum 10 tags")
        .optional()
        .default([]),
    showOnHomepage: zod_1.z.coerce.boolean().optional().default(false),
    // Resolved to a URL by an upload step (multer + Cloudinary) upstream of
    // this schema — this validates the *result*, not a raw multipart file.
    image: zod_1.z.string().url().optional(),
});
//# sourceMappingURL=product.validation.js.map