import { z } from "zod";
import { normalizedBDPhone } from "../../utils/helper";

const bdPhone = z
  .string()
  .trim()
  .transform((v) => normalizedBDPhone(v))
  .pipe(
    z.string().regex(/^\+8801[3-9]\d{8}$/, "Invalid Bangladeshi phone number"),
  );

const offlinePayments = ["cash", "cash_on_delivery", "credit"] as const;

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
  phone: z.preprocess((v) => (v === "" ? undefined : v), bdPhone.optional()),
  source: z.enum(["pos", "online"]).optional(),
  hasDue: z
    .enum(["true"])
    .transform((v) => (v === "true" ? true : undefined))
    .optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  sortBy: z
    .enum(["name", "createdAt", "stock", "sellingPrice", "lastPurchasedAt"])
    .optional()
    .default("createdAt"),
  sortOrder: z
    .enum(["asc", "desc"])
    .optional()
    .transform((v) => (v === "asc" ? 1 : -1))
    .default(1),
});

export const createCustomerSchema = z.object({
  name: z.string().trim().min(3, "At list 3 letter"),
  phone: bdPhone,
});
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type GetCustomerQuery = z.infer<typeof customerQuerySchema>;
