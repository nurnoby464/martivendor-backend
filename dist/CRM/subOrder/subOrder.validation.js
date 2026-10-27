"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderIdParamSchema = exports.sellerOrderListQuerySchema = void 0;
const zod_1 = __importDefault(require("zod"));
const subOrder_interface_1 = require("./subOrder.interface");
const emptyToUndefined = (v) => (v === "" ? undefined : v);
const isoDay = zod_1.default
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date");
const statusList = zod_1.default
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
    .pipe(zod_1.default
    .array(zod_1.default.enum(subOrder_interface_1.SUB_ORDER_STATUSES))
    .max(subOrder_interface_1.SUB_ORDER_STATUSES.length)
    .optional());
exports.sellerOrderListQuerySchema = zod_1.default
    .object({
    page: zod_1.default.coerce.number().int().min(1).max(10_000).default(1),
    limit: zod_1.default.coerce.number().int().min(1).max(100).default(10),
    status: statusList,
    payoutStatus: zod_1.default.preprocess(emptyToUndefined, zod_1.default.enum(subOrder_interface_1.PAYOUT_STATUS).optional()),
    search: zod_1.default.preprocess(emptyToUndefined, zod_1.default.string().trim().min(1).max(50).optional()),
    minTotal: zod_1.default.preprocess(emptyToUndefined, zod_1.default.coerce.number().min(0).optional()),
    maxTotal: zod_1.default.preprocess(emptyToUndefined, zod_1.default.coerce.number().min(0).optional()),
    dateFrom: zod_1.default.preprocess(emptyToUndefined, isoDay.optional()),
    dateTo: zod_1.default.preprocess(emptyToUndefined, isoDay.optional()),
    sortBy: zod_1.default.enum(["createdAt", "total"]).default("createdAt"),
    sortOrder: zod_1.default
        .enum(["asc", "desc"])
        .default("desc")
        .transform((v) => (v === "asc" ? 1 : -1)),
})
    .refine((d) => !d.dateFrom || !d.dateTo || d.dateFrom <= d.dateTo, {
    message: "dateFrom must be on or before dateTo",
    path: ["dateFrom"],
})
    .refine((d) => d.minTotal === undefined ||
    d.maxTotal === undefined ||
    d.minTotal <= d.maxTotal, { message: "minTotal must be <= maxTotal", path: ["minTotal"] });
exports.orderIdParamSchema = zod_1.default.object({
    orderId: zod_1.default.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid order id"),
});
//# sourceMappingURL=subOrder.validation.js.map