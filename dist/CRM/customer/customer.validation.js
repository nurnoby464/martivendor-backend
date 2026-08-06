"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerQuerySchema = exports.createSaleSchema = void 0;
const zod_1 = require("zod");
const saleItemSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1, "Product ID is required"),
    variantId: zod_1.z.string().min(1, "Variant ID is required"),
    quantity: zod_1.z.number().min(1, "Minimum quantity is 1"),
    sellingPrice: zod_1.z.number().min(0),
    discountType: zod_1.z.enum(["flat", "percentage"]).nullable().optional(),
    discountValue: zod_1.z.number().min(0).default(0),
});
const offlinePayments = ["cash", "cash_on_delivery", "credit"];
exports.createSaleSchema = zod_1.z.object({
    // customer
    customerName: zod_1.z.string().min(2, "Customer name is required"),
    customerPhone: zod_1.z.string().regex(/^01[3-9]\d{8}$/, "Invalid phone number"),
    items: zod_1.z.array(saleItemSchema).min(1, "At least one item is required"),
    paymentMethod: zod_1.z.enum([
        "cash",
        "cash_on_delivery",
        "credit",
        "card",
        "mobile_banking",
    ]),
    paidAmount: zod_1.z.number().min(0).default(0),
    note: zod_1.z.string().optional().nullable(),
});
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
    is_active: zod_1.z
        .enum(["true", "false"])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === "true")),
    sort_by: zod_1.z
        .enum(["name", "createdAt", "stock", "selling_price", "lastPurchasedAt"])
        .optional()
        .default("createdAt"),
    sort_order: zod_1.z
        .enum(["asc", "desc"])
        .optional()
        .transform((v) => (v === "asc" ? 1 : -1))
        .default(1),
});
//# sourceMappingURL=customer.validation.js.map