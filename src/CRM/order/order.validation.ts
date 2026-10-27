// src/module/order/order.validation.ts
import { z } from "zod";
import { PAYMENT_METHODS } from "../../globalTypes/payment.types";
import { SUB_ORDER_STATUSES } from "../subOrder/subOrder.interface";

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const orderItemSchema = z.object({
  variantId: z.string().trim().min(1, "Variant ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

const shippingAddressSchema = z.object({
  name: z.string().trim().min(1, "Recipient name is required"),
  phone: z.string().trim().min(1, "Recipient phone is required"),
  // email: z.string().trim().email("Invalid email").nullable().default(null),
  address: z.string().trim().min(1, "Address is required"),
  city: z.string().trim().min(1, "City is required"),
  zip: z.string().trim().nullable().default(null),
});

// ─── Create Order ─────────────────────────────────────────────────────────────

export const createOrderBody = z.object({
  // customer identification
  // userId: z
  //   .string()
  //   .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format")
  //   .optional()
  //   .nullable(),
  // sellerId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format"),
  phone: z.string().trim().min(1, "Customer phone is required"),
  name: z.string().trim().min(1, "Customer name is required"),
  email: z.string().trim().email("Invalid email"),

  // order items
  items: z.array(orderItemSchema).min(1, "At least one item is required"),

  // delivery
  shippingAddress: shippingAddressSchema,

  // financials
  // discountAmount: z.number().min(0).default(0),
  // taxAmount: z.number().min(0).default(0),
  // shippingCharge: z.number().min(0).default(0),
  // paidAmount: z.number().min(0).default(0),

  paymentMethod: z.enum(PAYMENT_METHODS),

  note: z.string().trim().nullable().default(null),
});

// ─── Update Order Status ──────────────────────────────────────────────────────

export const updateOrderStatusParam = z.object({
  id: z.string().trim().min(1, "Order ID is required"),
});

export const updateOrderStatusBody = z.object({
  order_status: z.enum([
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
});

// ─── Update Payment ───────────────────────────────────────────────────────────

export const updatePaymentParam = z.object({
  id: z.string().trim().min(1, "Order ID is required"),
});

export const updatePaymentBody = z.object({
  paid_amount: z.number().min(1, "Paid amount must be greater than 0"),
  payment_method: z.enum(["cash", "card", "mobile_banking", "online"]),
});

// ─── Get Order List ───────────────────────────────────────────────────────────

export const getOrderListQuery = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => parseInt(v ?? "1")),
  limit: z
    .string()
    .optional()
    .transform((v) => parseInt(v ?? "10")),
  orderStatus: z
    .string()
    .transform((v) => v.toLowerCase())
    .pipe(
      z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
    )
    .optional(),
  paymentStatus: z.enum(["unpaid", "partial", "paid"]).optional(),
  customerId: z.string().optional(),
  search: z.string().optional(), // search by order_number
  sortBy: z.enum(["name", "createdAt", "stock"]).default("createdAt"),
  sortOrder: z
    .enum(["asc", "dsc"])
    .default("dsc")
    .transform((v) => (v === "asc" ? 1 : -1)),
});

// ─── Get Order By ID ──────────────────────────────────────────────────────────

export const getOrderByIdParam = z.object({
  id: z.string().trim().min(1, "Order ID is required"),
});

const ORDER_STATUSES = [
  "all",
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;


// ─── getMyOrderById param validation ─────────────────────────────────────────

export const getMyOrderByIdParamSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
});

export const getMyOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(["all", ...SUB_ORDER_STATUSES]).default("all"),
  search: z.string().trim().max(50).optional(),
});


// ─── Types ────────────────────────────────────────────────────────────────────

export type TCreateOrderInput = z.infer<typeof createOrderBody>;
export type TUpdateOrderStatusInput = z.infer<typeof updateOrderStatusBody>;
export type TUpdatePaymentInput = z.infer<typeof updatePaymentBody>;
export type TGetOrderListQuery = z.infer<typeof getOrderListQuery>;
export type TShippingAddress = z.infer<typeof shippingAddressSchema>;
export type TMyOrdersQuery = z.infer<typeof getMyOrdersQuerySchema>;

