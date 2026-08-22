import { z } from "zod";

const saleItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().min(1, "Variant ID is required"),
  quantity: z.number().min(1, "Minimum quantity is 1"),
  // sellingPrice: z.number().min(0),
  // discountType: z.enum(["flat", "percentage"]).nullable().optional(),
  // discountValue: z.number().min(0).default(0),
});

const offlinePayments = ["cash", "cash_on_delivery", "credit"] as const;
export const posCustomerSchema = z.object({
  name: z.string().trim().optional(),
  phone: z.string().trim().optional(),
});

export const createSaleSchema = z.object({
  // customer
  customerId: z.string().nullable(),
  // customerEmail: z.string().optional(),
  // customerName: z.string().optional(),
  // customerPhone: z.string().optional(),
  // customer: posCustomerSchema.optional(),
  // .regex(/^01[3-9]\d{8}$/, "Invalid phone number"),

  items: z.array(saleItemSchema).min(1, "At least one item is required"),

  paymentMethod: z.enum([
    "cash",
    "cash_on_delivery",
    "credit",
    "card",
    "mobile_banking",
  ]),

  paidAmount: z.number().min(0).default(0),
  discountValue: z.number().min(0).default(0),
  discountType: z.enum(["flat", "percentage"]).default("percentage"),
  note: z.string().optional().nullable(),
  // discount: z.string(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
