// validations/navConfig.validation.ts
import mongoose from "mongoose";
import { z } from "zod";
const isValidObjectId = (value: string) =>
  mongoose.Types.ObjectId.isValid(value);

// ── Shared nav item shape ──
const NavItemSchema = z
  .object({
    label: z.string().min(1, "Label is required").trim(),
    keyword: z.string().trim().optional(),
    sectionTitle: z.string().trim().optional(),
    order: z.number().int().positive(),
    isActiveInNav: z.boolean(),
    showOnHomepage: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.showOnHomepage) {
        return !!data.keyword?.trim() && !!data.sectionTitle?.trim();
      }
      return true;
    },
    {
      message:
        "Category and section title are required when 'Show on homepage' is checked",
      path: ["showOnHomepage"],
    },
  );

// ── Create: full nav item, no _id yet ──

// ── Update: _id required, all fields optional except the refine rule ──
export const UpdateNavItemSchema = z
  .object({
    _id: z.string().min(1, "_id is required").refine(isValidObjectId, {
      message: "_id must be a valid ObjectId",
    }),
    label: z.string().min(1, "Label is required").trim().optional(),
    keyword: z.string().trim().optional(),
    sectionTitle: z.string().trim().optional(),
    order: z.number().int().positive().optional(),
    isActiveInNav: z.boolean().optional(),
    showOnHomepage: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.showOnHomepage === true) {
        return !!data.keyword?.trim() && !!data.sectionTitle?.trim();
      }
      return true;
    },
    {
      message:
        "Category and section title are required when 'Show on homepage' is checked",
      path: ["showOnHomepage"],
    },
  );

// ── Delete: only _id needed ──
export const DeleteNavItemSchema = z.object({
  id: z.string().min(1, "_id is required").refine(isValidObjectId, {
    message: "_id must be a valid ObjectId",
  }),
  navItemId: z.string().min(1, "_id is required").refine(isValidObjectId, {
    message: "_id must be a valid ObjectId",
  }),
});
export const UpdateParamsSchema = z.object({
  id: z.string().min(1, "_id is required").refine(isValidObjectId, {
    message: "_id must be a valid ObjectId",
  })
});

// ── Order change: array of { _id, order } pairs ──
export const ChangeNavItemOrderSchema = z.object({
  items: z
    .array(
      z.object({
        _id: z.string().min(1, "_id is required"),
        order: z.number().int().positive(),
      }),
    )
    .min(1, "At least one item is required")
    .refine(
      (items) => {
        const orders = items.map((i) => i.order);
        return new Set(orders).size === orders.length;
      },
      { message: "Order values must be unique" },
    ),
});
export const ReorderNavItemsBodySchema = z.object({
  navItems: z
    .array(
      z.object({
        _id: z.string().min(1).refine(isValidObjectId, {
          message: "_id must be a valid ObjectId",
        }),
        order: z.number().int().min(1),
      }),
    )
    .min(1)
    .refine(
      (items) => new Set(items.map((i) => i._id)).size === items.length,
      { message: "Duplicate _id values in navItems" },
    ),
});
export type TDeleteNavItem = z.infer<typeof DeleteNavItemSchema>;
export type TChangeNavItemOrder = z.infer<typeof ChangeNavItemOrderSchema>;
export type TUpdateNavItem = z.infer<typeof UpdateNavItemSchema>;
export const CreateNavItemSchema = NavItemSchema;
export type TCreateNavItem = z.infer<typeof CreateNavItemSchema>;
export type TReorderNavItems = z.infer<typeof ReorderNavItemsBodySchema>;
