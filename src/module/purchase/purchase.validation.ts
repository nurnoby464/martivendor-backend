// src/module/purchase/purchase.validation.ts
import { z } from "zod";
import mongoose from "mongoose";
import { ProductTag } from "../product/product.interface";
const mongoId = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");

// helper — reuse for all optional mongoId fields
const optionalEmail = z
  .string()
  .email("Invalid email")
  .trim()
  .optional()
  .or(z.literal("").transform(() => undefined))
  .or(z.null().transform(() => undefined));

const optionalMongoId = mongoId
  .optional()
  .or(z.literal("").transform(() => undefined))
  .or(z.null().transform(() => undefined));

const optionalString = z
  .string()
  .trim()
  .optional()
  .or(z.literal("").transform(() => undefined))
  .or(z.null().transform(() => undefined));

// ─── Create ───────────────────────────────────────────────────────────────────

export const updatePurchaseSchema = z.object({
  paidAmount: z.number().min(0, "Paid amount must be ≥ 0"),
  note: z.string().trim().max(2000).optional(),
  paymentMethod: z.enum(["cash", "online"]),
});

export const updateStockPurchaseSchema = z.object({
  variantId: z
    .string({
      error: "Product ID is required",
    })
    .min(1, "Product ID cannot be empty"),

  quantity: z
    .number({
      error: "Quantity is required",
    })
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than 0")
    .max(999999, "Quantity cannot exceed 999,999"),

  sellingPrice: z
    .number({
      error: "Selling price is required",
    })
    .positive("Selling price must be greater than 0")
    .min(0.01, "Selling price must be at least 0.01"),

  buyingPrice: z
    .number({
      error: "Buying price is required",
    })
    .nonnegative("Buying price cannot be negative"),

  paidAmount: z
    .number({
      error: "Paid amount is required",
    })
    .nonnegative("Paid amount cannot be negative"),
  purchaseDate: z
    .string()
    .datetime({ message: "Invalid date format" })
    .optional(),
  note: z.string().trim().max(2000).optional(),
});

export const purchaseParamsSchema = z.object({ id: mongoId });

export const purchaseQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => parseInt(v ?? "1")),
  limit: z
    .string()
    .optional()
    .transform((v) => parseInt(v ?? "10")),

  vendorId: mongoId.optional(),
  status: z.enum(["pending", "partial", "paid"]).optional(),
  fromDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  search: z.string().trim().optional(),
  toDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  // vendor name
  sortBy: z
    .enum(["purchase_date", "total_amount", "due_amount", "createdAt"])
    .default("createdAt"),
});
 // adjust path to wherever ProductTag actually lives

const purchaseItemSchema = z
  .object({
    productName: optionalString,
    productId: optionalMongoId,
    categoryId: optionalMongoId,
    categoryName: optionalString,
    color: z.string().trim().min(1, "Color is required"),
    size: z.string().trim().optional().default(""),
    buyingPrice: z.number({ error: "Unit price is required" }).min(0),
    sellingPrice: z.number({ error: "Selling price is required" }).min(0),
    quantity: z.number().int().positive("Quantity must be a positive integer"),
    images: z.array(z.string().url()).optional().default([]),
    lowStockAlert: z.coerce.number().int().min(0).optional().default(0),
    tags: z.array(z.nativeEnum(ProductTag)).optional().default([]),
    showOnHomepage: z.coerce.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (!data.productId || data.productId.trim() === "") {
      if (!data.productName || data.productName.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["productName"],
          message: "Product Name is required",
        });
      }
    }
    if (!data.categoryId || data.categoryId?.trim() === "") {
      if (!data.categoryName || data.categoryName.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["categoryName"],
          message: "Category Name is required",
        });
      }
    }
  });

export const createPurchaseSchema = z.object({
  purchaseDate: z
    .string()
    .trim()
    .date("Must be a valid date YYYY-MM-DD")
    .optional(),
  paidAmount: z.coerce.number().min(0).optional().default(0),
  note: z.string().trim().max(2000).optional(),
  items: z
    .array(purchaseItemSchema)
    .min(1, "At least one item is required")
    .max(500, "Maximum 500 items per purchase"),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>;
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>;
export type ListPurchaseQuery = z.infer<typeof purchaseQuerySchema>;
export type UpdateStockPurchaseInput = z.infer<
  typeof updateStockPurchaseSchema
>;
