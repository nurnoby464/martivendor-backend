// src/module/category/category.validation.ts
import { z } from "zod";
import mongoose from "mongoose";

const objectId = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
  });

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Min 2 characters")
    .max(100, "Max 100 characters"),
  parentId: objectId.optional().nullable(),
  isActive: z.boolean(),
  image: z.string().trim().url("Invalid image URL").optional().nullable(),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  image: z.string().trim().url().optional().nullable(),
  is_active: z.boolean().optional(),
});

export const categoryParamsSchema = z.object({
  id: objectId,
});

export const categoryQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => parseInt(v ?? "1")),
  limit: z
    .string()
    .optional()
    .transform((v) => parseInt(v ?? "10")),
  search: z.string().trim().optional(),
  parent_id: z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      if (v === "null") return null;
      if (!mongoose.Types.ObjectId.isValid(v))
        throw new Error("Invalid ObjectId");
      return v;
    }),
  depth: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v) : undefined)),
  is_active: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});
