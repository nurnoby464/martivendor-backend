"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatusSchema = exports.updateTagsSchema = exports.customerQuerySchema = void 0;
const zod_1 = require("zod");
const helper_1 = require("../../utils/helper");
const bdPhone = zod_1.z
    .string()
    .trim()
    .transform((v) => (0, helper_1.normalizedBDPhone)(v))
    .pipe(zod_1.z.string().regex(/^\+8801[3-9]\d{8}$/, "Invalid Bangladeshi phone number"));
const offlinePayments = ["cash", "cash_on_delivery", "credit"];
exports.customerQuerySchema = zod_1.z.object({
    page: zod_1.z
        .string()
        .optional()
        .transform((v) => parseInt(v ?? "1")),
    limit: zod_1.z
        .string()
        .optional()
        .transform((v) => parseInt(v ?? "10")),
    search: zod_1.z.string().trim().optional(),
    phone: zod_1.z.preprocess((v) => (v === "" ? undefined : v), bdPhone.optional()),
    source: zod_1.z.enum(["pos", "online"]).optional(),
    hasDue: zod_1.z
        .enum(["true"])
        .transform((v) => (v === "true" ? true : undefined))
        .optional(),
    isActive: zod_1.z
        .enum(["true", "false"])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === "true")),
    sortBy: zod_1.z
        .enum(["name", "createdAt", "stock", "sellingPrice", "lastPurchasedAt"])
        .optional()
        .default("createdAt"),
    sortOrder: zod_1.z
        .enum(["asc", "desc"])
        .optional()
        .transform((v) => (v === "asc" ? 1 : -1))
        .default(1),
});
exports.updateTagsSchema = zod_1.z.object({
    tags: zod_1.z.array(zod_1.z.string().trim().min(1, "Tag cannot be empty")),
});
exports.updateStatusSchema = zod_1.z.object({
    isActive: zod_1.z
        .enum(["true", "false"])
        .transform((v) => (v === "false" ? false : true)),
});
//# sourceMappingURL=sellerCustomer.validation.js.map