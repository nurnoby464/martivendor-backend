"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPurchaseSchema = exports.purchaseQuerySchema = exports.purchaseParamsSchema = exports.updateStockPurchaseSchema = exports.updatePurchaseSchema = void 0;
// src/module/purchase/purchase.validation.ts
const zod_1 = require("zod");
const product_interface_1 = require("../product/product.interface");
const mongoId = zod_1.z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");
// helper — reuse for all optional mongoId fields
const optionalEmail = zod_1.z
    .string()
    .email("Invalid email")
    .trim()
    .optional()
    .or(zod_1.z.literal("").transform(() => undefined))
    .or(zod_1.z.null().transform(() => undefined));
const optionalMongoId = mongoId
    .optional()
    .or(zod_1.z.literal("").transform(() => undefined))
    .or(zod_1.z.null().transform(() => undefined));
const optionalString = zod_1.z
    .string()
    .trim()
    .optional()
    .or(zod_1.z.literal("").transform(() => undefined))
    .or(zod_1.z.null().transform(() => undefined));
// ─── Create ───────────────────────────────────────────────────────────────────
exports.updatePurchaseSchema = zod_1.z.object({
    paidAmount: zod_1.z.number().min(0, "Paid amount must be ≥ 0"),
    note: zod_1.z.string().trim().max(2000).optional(),
    paymentMethod: zod_1.z.enum(["cash", "online"]),
});
exports.updateStockPurchaseSchema = zod_1.z.object({
    variantId: zod_1.z
        .string({
        error: "Product ID is required",
    })
        .min(1, "Product ID cannot be empty"),
    quantity: zod_1.z
        .number({
        error: "Quantity is required",
    })
        .int("Quantity must be an integer")
        .positive("Quantity must be greater than 0")
        .max(999999, "Quantity cannot exceed 999,999"),
    sellingPrice: zod_1.z
        .number({
        error: "Selling price is required",
    })
        .positive("Selling price must be greater than 0")
        .min(0.01, "Selling price must be at least 0.01"),
    buyingPrice: zod_1.z
        .number({
        error: "Buying price is required",
    })
        .nonnegative("Buying price cannot be negative"),
    paidAmount: zod_1.z
        .number({
        error: "Paid amount is required",
    })
        .nonnegative("Paid amount cannot be negative"),
    purchaseDate: zod_1.z
        .string()
        .datetime({ message: "Invalid date format" })
        .optional(),
    note: zod_1.z.string().trim().max(2000).optional(),
});
exports.purchaseParamsSchema = zod_1.z.object({ id: mongoId });
exports.purchaseQuerySchema = zod_1.z.object({
    page: zod_1.z
        .string()
        .optional()
        .transform((v) => parseInt(v ?? "1")),
    limit: zod_1.z
        .string()
        .optional()
        .transform((v) => parseInt(v ?? "10")),
    vendorId: mongoId.optional(),
    status: zod_1.z.enum(["pending", "partial", "paid"]).optional(),
    fromDate: zod_1.z
        .string()
        .optional()
        .transform((v) => (v ? new Date(v) : undefined)),
    search: zod_1.z.string().trim().optional(),
    toDate: zod_1.z
        .string()
        .optional()
        .transform((v) => (v ? new Date(v) : undefined)),
    sortOrder: zod_1.z.enum(["asc", "desc"]).optional().default("desc"),
    // vendor name
    sortBy: zod_1.z
        .enum(["purchase_date", "total_amount", "due_amount", "createdAt"])
        .default("createdAt"),
});
// adjust path to wherever ProductTag actually lives
const purchaseItemSchema = zod_1.z
    .object({
    productName: optionalString,
    productId: optionalMongoId,
    categoryId: optionalMongoId,
    categoryName: optionalString,
    color: zod_1.z.string().trim().min(1, "Color is required"),
    size: zod_1.z.string().trim().optional().default(""),
    buyingPrice: zod_1.z.number({ error: "Unit price is required" }).min(0),
    sellingPrice: zod_1.z.number({ error: "Selling price is required" }).min(0),
    quantity: zod_1.z.number().int().positive("Quantity must be a positive integer"),
    images: zod_1.z.array(zod_1.z.string().url()).optional().default([]),
    lowStockAlert: zod_1.z.coerce.number().int().min(0).optional().default(0),
    tags: zod_1.z.array(zod_1.z.nativeEnum(product_interface_1.ProductTag)).optional().default([]),
    showOnHomepage: zod_1.z.coerce.boolean().optional().default(false),
})
    .superRefine((data, ctx) => {
    if (!data.productId || data.productId.trim() === "") {
        if (!data.productName || data.productName.trim() === "") {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ["productName"],
                message: "Product Name is required",
            });
        }
    }
    if (!data.categoryId || data.categoryId?.trim() === "") {
        if (!data.categoryName || data.categoryName.trim() === "") {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ["categoryName"],
                message: "Category Name is required",
            });
        }
    }
});
exports.createPurchaseSchema = zod_1.z.object({
    purchaseDate: zod_1.z
        .string()
        .trim()
        .date("Must be a valid date YYYY-MM-DD")
        .optional(),
    paidAmount: zod_1.z.coerce.number().min(0).optional().default(0),
    note: zod_1.z.string().trim().max(2000).optional(),
    items: zod_1.z
        .array(purchaseItemSchema)
        .min(1, "At least one item is required")
        .max(500, "Maximum 500 items per purchase"),
});
//# sourceMappingURL=purchase.validation.js.map