"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyOrdersQuerySchema = exports.getMyOrderByIdParamSchema = exports.getOrderByIdParam = exports.getOrderListQuery = exports.updatePaymentBody = exports.updatePaymentParam = exports.updateOrderStatusBody = exports.updateOrderStatusParam = exports.createOrderBody = void 0;
// src/module/order/order.validation.ts
const zod_1 = require("zod");
const payment_types_1 = require("../../globalTypes/payment.types");
const subOrder_interface_1 = require("../subOrder/subOrder.interface");
// ─── Sub-schemas ──────────────────────────────────────────────────────────────
const orderItemSchema = zod_1.z.object({
    variantId: zod_1.z.string().trim().min(1, "Variant ID is required"),
    quantity: zod_1.z.number().int().min(1, "Quantity must be at least 1"),
});
const shippingAddressSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, "Recipient name is required"),
    phone: zod_1.z.string().trim().min(1, "Recipient phone is required"),
    // email: z.string().trim().email("Invalid email").nullable().default(null),
    address: zod_1.z.string().trim().min(1, "Address is required"),
    city: zod_1.z.string().trim().min(1, "City is required"),
    zip: zod_1.z.string().trim().nullable().default(null),
});
// ─── Create Order ─────────────────────────────────────────────────────────────
exports.createOrderBody = zod_1.z.object({
    // customer identification
    // userId: z
    //   .string()
    //   .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format")
    //   .optional()
    //   .nullable(),
    // sellerId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format"),
    phone: zod_1.z.string().trim().min(1, "Customer phone is required"),
    name: zod_1.z.string().trim().min(1, "Customer name is required"),
    email: zod_1.z.string().trim().email("Invalid email"),
    // order items
    items: zod_1.z.array(orderItemSchema).min(1, "At least one item is required"),
    // delivery
    shippingAddress: shippingAddressSchema,
    // financials
    // discountAmount: z.number().min(0).default(0),
    // taxAmount: z.number().min(0).default(0),
    // shippingCharge: z.number().min(0).default(0),
    // paidAmount: z.number().min(0).default(0),
    paymentMethod: zod_1.z.enum(payment_types_1.PAYMENT_METHODS),
    note: zod_1.z.string().trim().nullable().default(null),
});
// ─── Update Order Status ──────────────────────────────────────────────────────
exports.updateOrderStatusParam = zod_1.z.object({
    id: zod_1.z.string().trim().min(1, "Order ID is required"),
});
exports.updateOrderStatusBody = zod_1.z.object({
    order_status: zod_1.z.enum([
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
    ]),
});
// ─── Update Payment ───────────────────────────────────────────────────────────
exports.updatePaymentParam = zod_1.z.object({
    id: zod_1.z.string().trim().min(1, "Order ID is required"),
});
exports.updatePaymentBody = zod_1.z.object({
    paid_amount: zod_1.z.number().min(1, "Paid amount must be greater than 0"),
    payment_method: zod_1.z.enum(["cash", "card", "mobile_banking", "online"]),
});
// ─── Get Order List ───────────────────────────────────────────────────────────
exports.getOrderListQuery = zod_1.z.object({
    page: zod_1.z
        .string()
        .optional()
        .transform((v) => parseInt(v ?? "1")),
    limit: zod_1.z
        .string()
        .optional()
        .transform((v) => parseInt(v ?? "10")),
    orderStatus: zod_1.z
        .string()
        .transform((v) => v.toLowerCase())
        .pipe(zod_1.z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]))
        .optional(),
    paymentStatus: zod_1.z.enum(["unpaid", "partial", "paid"]).optional(),
    customerId: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(), // search by order_number
    sortBy: zod_1.z.enum(["name", "createdAt", "stock"]).default("createdAt"),
    sortOrder: zod_1.z
        .enum(["asc", "dsc"])
        .default("dsc")
        .transform((v) => (v === "asc" ? 1 : -1)),
});
// ─── Get Order By ID ──────────────────────────────────────────────────────────
exports.getOrderByIdParam = zod_1.z.object({
    id: zod_1.z.string().trim().min(1, "Order ID is required"),
});
const ORDER_STATUSES = [
    "all",
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
];
// ─── getMyOrderById param validation ─────────────────────────────────────────
exports.getMyOrderByIdParamSchema = zod_1.z.object({
    orderId: zod_1.z.string().min(1, "Order ID is required"),
});
exports.getMyOrdersQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(10),
    status: zod_1.z.enum(["all", ...subOrder_interface_1.SUB_ORDER_STATUSES]).default("all"),
    search: zod_1.z.string().trim().max(50).optional(),
});
//# sourceMappingURL=order.validation.js.map