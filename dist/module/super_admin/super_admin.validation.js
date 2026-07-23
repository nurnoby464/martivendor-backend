"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutSchema = exports.registerCustomerSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2, "Name must be at least 2 characters"),
    email: zod_1.z.email("Please enter a valid email").toLowerCase().trim(),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
    role: zod_1.z.enum([
        "super_admin",
        "admin",
        "account",
        "site_management",
        "inventory",
        "sales",
        "report",
    ]),
    sellerId: zod_1.z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid company id")
        .optional()
        .nullable(),
    is_active: zod_1.z.boolean().optional(),
    createdBy: zod_1.z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid user id")
        .optional()
        .nullable(),
});
exports.registerCustomerSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2, "Name must be at least 2 characters"),
    email: zod_1.z.email("Please enter a valid email").toLowerCase().trim(),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
    phone: zod_1.z
        .string()
        .regex(/^01[3-9]\d{8}$/, "Invalid Bangladeshi phone number")
        .nullable()
        .optional(),
});
exports.checkoutSchema = zod_1.z.object({
    body: zod_1.z.object({
        phone: zod_1.z
            .string()
            .regex(/^01[3-9]\d{8}$/, "Phone number is required for checkout"),
        // ...rest of sale fields
    }),
});
//# sourceMappingURL=super_admin.validation.js.map