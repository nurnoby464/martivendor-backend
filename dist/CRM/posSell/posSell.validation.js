"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSaleSchema = exports.posCustomerSchema = void 0;
const zod_1 = require("zod");
const saleItemSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1, "Product ID is required"),
    variantId: zod_1.z.string().min(1, "Variant ID is required"),
    quantity: zod_1.z.number().min(1, "Minimum quantity is 1"),
    // sellingPrice: z.number().min(0),
    // discountType: z.enum(["flat", "percentage"]).nullable().optional(),
    // discountValue: z.number().min(0).default(0),
});
const offlinePayments = ["cash", "cash_on_delivery", "credit"];
exports.posCustomerSchema = zod_1.z.object({
    name: zod_1.z.string().trim().optional(),
    phone: zod_1.z.string().trim().optional(),
});
exports.createSaleSchema = zod_1.z.object({
    // customer
    customerId: zod_1.z.string().nullable(),
    // customerEmail: z.string().optional(),
    // customerName: z.string().optional(),
    // customerPhone: z.string().optional(),
    // customer: posCustomerSchema.optional(),
    // .regex(/^01[3-9]\d{8}$/, "Invalid phone number"),
    items: zod_1.z.array(saleItemSchema).min(1, "At least one item is required"),
    paymentMethod: zod_1.z.enum([
        "cash",
        "cash_on_delivery",
        "credit",
        "card",
        "mobile_banking",
    ]),
    paidAmount: zod_1.z.number().min(0).default(0),
    discountValue: zod_1.z.number().min(0).default(0),
    discountType: zod_1.z.enum(["flat", "percentage"]).default("percentage"),
    note: zod_1.z.string().optional().nullable(),
    // discount: z.string(),
});
//# sourceMappingURL=posSell.validation.js.map