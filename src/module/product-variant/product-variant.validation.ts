import { z } from "zod";

const mongoId = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");

const attributeSchema = z.object({
  key: z.string().trim().min(1),
  value: z.string().trim().min(1),
});

export const createVariantSchema = z.object({
  attributes: z
    .array(attributeSchema)
    .min(1, "At least one attribute required"),
  //   sku            : z.string().trim().toUpperCase().optional(),   // auto-generated if omitted
  buyingPrice: z.number({ error: "Buying price is required" }).min(0),
  sellingPrice: z.number({ error: "Selling price is required" }).min(0),
  stock: z.number().int().min(0).optional().default(0),
  lowStockAlert: z.number().int().min(0).optional().default(5),
  image: z.string().trim().url("Must be a valid image URL").nullable(),
});

export const updateVariantSchema = z
  .object({
    buyingPrice: z.number().min(0).optional(),
    sellingPrice: z.number().min(0).optional(),
    stock: z.number().int().min(0).optional(),
    lowStockAlert: z.number().int().min(0).optional(),
    image: z.string().trim().url().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field is required",
  });

export const variantParamsSchema = z.object({ id: mongoId });

export const productVariantParamsSchema = z.object({
  id: mongoId, // product id
  variantId: mongoId,
});

export const productVariantQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => parseInt(v ?? "1")),
  limit: z
    .string()
    .optional()
    .transform((v) => parseInt(v ?? "10")),
  search: z.string().trim().optional(),
  sortOrder: z
    .enum(["asc", "desc"])
    .optional()
    .transform((v) => (v === "asc" ? 1 : -1))
    .default(-1),
  // vendor name
  sortBy: z
    .enum(["purchase_date", "total_amount", "due_amount", "createdAt"])
    .default("createdAt"),
  stock: z.enum(["lowStock", "outOfStock", "reminderStock"]).optional(),
});

export const editProductVariantSchema = z.object({
  variantId: mongoId,
  sellingPrice: z
    .number({ error: "Selling price is required" })
    .positive("Selling price must be greater than 0")
    .min(0.01, "Selling price must be at least 0.01"),

  newImage: z.string().url("Invalid image URL").nullable().optional(),
  previousImage: z.string().url("Invalid image URL"),

  alertStock: z
    .number()
    .int("Alert stock must be an integer")
    .nonnegative("Alert stock cannot be negative")
    .max(999999, "Alert stock cannot exceed 999,999")
    .optional(),
});

export type EditProductVariantInput = z.infer<typeof editProductVariantSchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
