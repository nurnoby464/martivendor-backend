"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.superAdminSchema = exports.checkoutSchema = exports.registerCustomerSchema = exports.createUserSchema = void 0;
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
exports.superAdminSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2, "Name must be at least 2 characters"),
    shopName: zod_1.z.string().trim().min(4, "Shop name must be at least 4 characters"),
    phone: zod_1.z.string().trim().regex(/^01[3-9]\d{8}$/, "Enter a valid Bangladeshi phone number").optional(),
    email: zod_1.z.string().trim().toLowerCase().pipe(zod_1.z.email("Enter a valid email")),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters")
});
//# sourceMappingURL=user.validation.js.map