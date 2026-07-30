// src/module/product/product.validation.ts
import { z } from "zod";
import mongoose from "mongoose";
import { ProductTag, ProductType } from "./product.interface";

const objectId = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
  });

const attributeSchema = z.object({
  key: z.string().trim().min(1, "Attribute key is required"),
  value: z.string().trim().min(1, "Attribute value is required"),
});

export const updateProductSchema = z.object({
  // category_id   : objectId.optional(),
  // vendor_id     : objectId.optional(),
  name: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().optional().nullable(),
  images: z.array(z.string().trim().url()).optional(),
  buyingPrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  stock: z.number().min(0).optional(),
  lowStockAlert: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

// ─── Variant ──────────────────────────────────────────────

// ─── Params ───────────────────────────────────────────────
export const productParamsSchema = z.object({
  id: objectId,
});
export const productSlugParamsSchema = z.object({
  slug: z.string().toLowerCase().trim(),
});

// ─── Query ────────────────────────────────────────────────
export const productQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => parseInt(v ?? "1")),
  limit: z
    .string()
    .optional()
    .transform((v) => parseInt(v ?? "10")),
  search: z.string().trim().optional(),
  productType: z.enum(ProductType).optional(),
  categoryId: objectId.optional(),
  // vendor_id: objectId.optional(),
  hasVariants: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  lowStock: z.enum(["true"]).optional(), // ?low_stock=true → filter stock <= alert
  sortBy: z
    .enum(["name", "createdAt", "stock", "sellingPrice", "updatedAt"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  tags: z
    .union([z.enum(ProductTag), z.array(z.enum(ProductTag)).max(10)])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .optional(),
  discount: z.coerce.number().min(0).max(100).optional(),
  hasDiscount: z
    .enum(["true","false"])
    .transform((v) => (v === "true" ? true : false))
    .optional(),
});

const mongoIdField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((v) => mongoose.Types.ObjectId.isValid(v), `Invalid ${label}`);

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name cannot exceed 200 characters"),
  productId: z.string().optional(),
  productType: z.enum(ProductType).default(ProductType.NEW),
  // Wire field is `category` (matches CategoryCombobox's hidden input name).
  categoryId: mongoIdField("Category"),
  // Sent alongside `category` for display purposes only — the product is
  // normalized against the id, never this string. Not persisted.
  categoryName: z.string().trim().optional(),

  color: z.string().trim().min(1, "Color is required"),
  size: z.string().trim().optional().default(""),

  sellingPrice: z.coerce.number({ error: "Selling price is required" }).min(0),
  buyingPrice: z.coerce.number().min(0).optional().default(0),
  discount: z.coerce.number().min(0).max(100).optional().default(0),

  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  lowStockAlert: z.coerce.number().int().min(0).optional().default(5),

  description: z.string().trim().max(5000).optional().default(""),
  specifications: z.string().trim().max(5000).optional().default(""),

  tags: z
    .array(z.nativeEnum(ProductTag))
    .max(10, "Maximum 10 tags")
    .optional()
    .default([]),
  showOnHomepage: z.coerce.boolean().optional().default(false),

  // Resolved to a URL by an upload step (multer + Cloudinary) upstream of
  // this schema — this validates the *result*, not a raw multipart file.
  image: z.string().url().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductQuery = z.infer<typeof createProductSchema>;
export type GetProductQuery = z.infer<typeof productQuerySchema>;
export type GetProductSlugQuery = z.infer<typeof productSlugParamsSchema>;
