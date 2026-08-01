import { z } from "zod";
import mongoose from "mongoose";
import { ProductTag, ProductType } from "../product/product.interface";

const objectId = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
  });
export const productParamsSchema = z.object({
  id: objectId,
});

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
    .enum(["true", "false"])
    .transform((v) => (v === "true" ? true : false))
    .optional(),
});

export type GetProductParamsQuery = z.infer<typeof productParamsSchema>;
export type GetProductQueryInput = z.infer<typeof productQuerySchema>;