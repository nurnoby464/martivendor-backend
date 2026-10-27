import z from "zod";
import { PAYOUT_STATUS, SUB_ORDER_STATUSES } from "./subOrder.interface";

const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);
const isoDay = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date");

const statusList = z
  .string()
  .trim()
  .optional()
  .transform((v) => {
    const list = (v ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s && s !== "all");
    return list.length ? [...new Set(list)] : undefined;
  })
  .pipe(
    z
      .array(z.enum(SUB_ORDER_STATUSES))
      .max(SUB_ORDER_STATUSES.length)
      .optional(),
  );

export const sellerOrderListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(10_000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: statusList,
    payoutStatus: z.preprocess(
      emptyToUndefined,
      z.enum(PAYOUT_STATUS).optional(),
    ),
    search: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(1).max(50).optional(),
    ),
    minTotal: z.preprocess(
      emptyToUndefined,
      z.coerce.number().min(0).optional(),
    ),
    maxTotal: z.preprocess(
      emptyToUndefined,
      z.coerce.number().min(0).optional(),
    ),
    dateFrom: z.preprocess(emptyToUndefined, isoDay.optional()),
    dateTo: z.preprocess(emptyToUndefined, isoDay.optional()),
    sortBy: z.enum(["createdAt", "total"]).default("createdAt"),
    sortOrder: z
      .enum(["asc", "desc"])
      .default("desc")
      .transform((v) => (v === "asc" ? (1 as const) : (-1 as const))),
  })
  .refine((d) => !d.dateFrom || !d.dateTo || d.dateFrom <= d.dateTo, {
    message: "dateFrom must be on or before dateTo",
    path: ["dateFrom"],
  })
  .refine(
    (d) =>
      d.minTotal === undefined ||
      d.maxTotal === undefined ||
      d.minTotal <= d.maxTotal,
    { message: "minTotal must be <= maxTotal", path: ["minTotal"] },
  );
export const orderIdParamSchema = z.object({
  orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid order id"),
});
export type TSellerOrderListQuery = z.infer<typeof sellerOrderListQuerySchema>;
