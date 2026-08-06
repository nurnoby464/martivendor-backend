"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSaleSchema = void 0;
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
    customerId: zod_1.z.string().optional(),
    customerEmail: zod_1.z.string().optional(),
    customerName: zod_1.z.string().optional(),
    customerPhone: zod_1.z
        .string().optional(),
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
    note: zod_1.z.string().optional().nullable(),
    discount: zod_1.z.string()
});
//# sourceMappingURL=sales.validation.js.map