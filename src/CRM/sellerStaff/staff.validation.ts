import { z } from "zod";

const saleItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().min(1, "Variant ID is required"),
  quantity: z.number().min(1, "Minimum quantity is 1"),
  sellingPrice: z.number().min(0),
  discountType: z.enum(["flat", "percentage"]).nullable().optional(),
  discountValue: z.number().min(0).default(0),
});

const offlinePayments = ["cash", "cash_on_delivery", "credit"] as const;

export const createSaleSchema = z.object({
  // customer
  customerName: z.string().min(2, "Customer name is required"),
  customerPhone: z.string().regex(/^01[3-9]\d{8}$/, "Invalid phone number"),

  items: z.array(saleItemSchema).min(1, "At least one item is required"),

  paymentMethod: z.enum([
    "cash",
    "cash_on_delivery",
    "credit",
    "card",
    "mobile_banking",
  ]),

  paidAmount: z.number().min(0).default(0),
  note: z.string().optional().nullable(),
});

export const customerQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => parseInt(v ?? "1")),
  limit: z
    .string()
    .optional()
    .transform((v) => parseInt(v ?? "10")),
  search: z.string().trim().optional(),

  is_active: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  sort_by: z
    .enum(["name", "createdAt", "stock", "selling_price"])
    .optional()
    .default("createdAt"),
  sort_order: z
    .enum(["asc", "desc"])
    .optional()
    .transform((v) => (v === "asc" ? 1 : -1))
    .default(1),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type GetCustomerQuery = z.infer<typeof customerQuerySchema>;

