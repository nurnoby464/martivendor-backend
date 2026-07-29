"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editProductVariantSchema = exports.productVariantQuerySchema = exports.productVariantParamsSchema = exports.variantParamsSchema = exports.updateVariantSchema = exports.createVariantSchema = void 0;
const zod_1 = require("zod");
const mongoId = zod_1.z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");
const attributeSchema = zod_1.z.object({
    key: zod_1.z.string().trim().min(1),
    value: zod_1.z.string().trim().min(1),
});
exports.createVariantSchema = zod_1.z.object({
    attributes: zod_1.z
        .array(attributeSchema)
        .min(1, "At least one attribute required"),
    //   sku            : z.string().trim().toUpperCase().optional(),   // auto-generated if omitted
    buyingPrice: zod_1.z.number({ error: "Buying price is required" }).min(0),
    sellingPrice: zod_1.z.number({ error: "Selling price is required" }).min(0),
    stock: zod_1.z.number().int().min(0).optional().default(0),
    lowStockAlert: zod_1.z.number().int().min(0).optional().default(5),
    image: zod_1.z.string().trim().url("Must be a valid image URL").nullable(),
});
exports.updateVariantSchema = zod_1.z
    .object({
    buyingPrice: zod_1.z.number().min(0).optional(),
    sellingPrice: zod_1.z.number().min(0).optional(),
    stock: zod_1.z.number().int().min(0).optional(),
    lowStockAlert: zod_1.z.number().int().min(0).optional(),
    image: zod_1.z.string().trim().url().optional(),
    isActive: zod_1.z.boolean().optional(),
})
    .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field is required",
});
exports.variantParamsSchema = zod_1.z.object({ id: mongoId });
exports.productVariantParamsSchema = zod_1.z.object({
    id: mongoId, // product id
    variantId: mongoId,
});
exports.productVariantQuerySchema = zod_1.z.object({
    page: zod_1.z
        .string()
        .optional()
        .transform((v) => parseInt(v ?? "1")),
    limit: zod_1.z
        .string()
        .optional()
        .transform((v) => parseInt(v ?? "10")),
    search: zod_1.z.string().trim().optional(),
    sortOrder: zod_1.z
        .enum(["asc", "desc"])
        .optional()
        .transform((v) => (v === "asc" ? 1 : -1))
        .default(-1),
    // vendor name
    sortBy: zod_1.z
        .enum(["purchase_date", "total_amount", "due_amount", "createdAt"])
        .default("createdAt"),
    stock: zod_1.z.enum(["lowStock", "outOfStock", "reminderStock"]).optional(),
});
exports.editProductVariantSchema = zod_1.z.object({
    variantId: mongoId,
    sellingPrice: zod_1.z
        .number({ error: "Selling price is required" })
        .positive("Selling price must be greater than 0")
        .min(0.01, "Selling price must be at least 0.01"),
    newImage: zod_1.z.string().url("Invalid image URL").nullable().optional(),
    previousImage: zod_1.z.string().url("Invalid image URL"),
    alertStock: zod_1.z
        .number()
        .int("Alert stock must be an integer")
        .nonnegative("Alert stock cannot be negative")
        .max(999999, "Alert stock cannot exceed 999,999")
        .optional(),
});
//# sourceMappingURL=product-variant.validation.js.map