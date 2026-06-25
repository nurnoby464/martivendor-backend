"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSocialMediaSchema = exports.updateUserSchema = exports.userParamsSchema = exports.userQuerySchema = exports.updateCompanySchema = exports.companyQuerySchema = exports.companyParamsSchema = exports.createCompanyUserSchema = exports.createNewCompanySchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createNewCompanySchema = zod_1.default.object({
    company_name: zod_1.default
        .string({ error: "Company name is required" })
        .trim()
        .min(2, "Company name must be at least 2 characters")
        .max(200, "Company name cannot exceed 200 characters"),
    company_email: zod_1.default.email("Please enter a valid email").toLowerCase().trim(),
    phone: zod_1.default
        .string({ error: "Phone number is required" })
        .trim()
        .min(7, "Phone number is too short")
        .max(20, "Phone number is too long")
        .regex(/^\+?[0-9\s\-().]+$/, "Please enter a valid phone number"),
    address: zod_1.default
        .string({ error: "Address is required" })
        .trim()
        .min(5, "Address must be at least 5 characters")
        .max(500, "Address cannot exceed 500 characters"),
    logo: zod_1.default.string().url("Logo must be a valid URL").nullable().optional(),
    domain: zod_1.default
        .string()
        .trim()
        .toLowerCase()
        .regex(/^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/, "Please enter a valid domain (e.g. fashionzone.com.bd)")
        .nullable()
        .optional(),
    subdomain: zod_1.default
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers and hyphens")
        .min(2, "Subdomain must be at least 2 characters")
        .max(63, "Subdomain cannot exceed 63 characters")
        .nullable()
        .optional(),
    status: zod_1.default
        .enum(["active", "inactive", "suspended"], {
        message: "Invalid status value",
    })
        .default("active"),
    password: zod_1.default.string().min(8, "Password must be at least 8 characters"),
});
exports.createCompanyUserSchema = zod_1.default.object({
    companyId: zod_1.default
        .string()
        .trim()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid company id")
        .optional(),
    email: zod_1.default.email("Please enter a valid email").toLowerCase().trim(),
    // phone: z
    //   .string({ error: "Phone number is required" })
    //   .trim()
    //   .min(7, "Phone number is too short")
    //   .max(20, "Phone number is too long")
    //   .regex(/^\+?[0-9\s\-().]+$/, "Please enter a valid phone number"),
    name: zod_1.default
        .string({ error: "Name is required" })
        .trim()
        .min(3, "Name must be at least 3 characters")
        .max(500, "Name cannot exceed 500 characters"),
    role: zod_1.default.enum(["report", "sales", "inventory", "site_management", "account"], {
        message: "Invalid role value",
    }),
    password: zod_1.default.string().min(8, "Password must be at least 8 characters"),
});
exports.companyParamsSchema = zod_1.default.object({
    id: zod_1.default.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid company id"),
});
exports.companyQuerySchema = zod_1.default.object({
    page: zod_1.default
        .string()
        .optional()
        .transform((v) => parseInt(v ?? "1")),
    limit: zod_1.default
        .string()
        .optional()
        .transform((v) => Math.min(parseInt(v ?? "10"), 200)),
    sortBy: zod_1.default.string().optional(),
    sortOrder: zod_1.default
        .string()
        .optional()
        .transform((v) => (v === "asc" ? 1 : -1)),
    search: zod_1.default.string().trim().optional(),
    status: zod_1.default.enum(["active", "inactive", "suspended"]).optional(),
});
exports.updateCompanySchema = zod_1.default.object({
    company_name: zod_1.default.string().trim().min(2).max(200).optional(),
    companyNavName: zod_1.default.string().trim().min(2).max(200).optional(),
    phone: zod_1.default.string().trim().min(7).max(20).optional(),
    address: zod_1.default.string().trim().min(5).max(500).optional(),
    logo: zod_1.default.string().url("Logo must be a valid URL").nullable().optional(),
    domain: zod_1.default
        .string()
        .trim()
        .toLowerCase()
        .regex(/^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/, "Invalid domain")
        .nullable()
        .optional(),
    subdomain: zod_1.default
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers and hyphens")
        .min(2)
        .max(63)
        .nullable()
        .optional(),
    status: zod_1.default.enum(["active", "inactive", "suspended"]).optional(),
});
const objectIdSchema = zod_1.default
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid id format");
exports.userQuerySchema = zod_1.default.object({
    page: zod_1.default
        .string()
        .optional()
        .transform((v) => parseInt(v ?? "1")),
    limit: zod_1.default
        .string()
        .optional()
        .transform((v) => Math.min(parseInt(v ?? "10"), 100)),
    search: zod_1.default.string().trim().optional(),
    role: zod_1.default
        .enum([
        "admin",
        "account",
        "site_management",
        "inventory",
        "sales",
        "report",
    ])
        .optional(),
    is_active: zod_1.default
        .string()
        .optional()
        .transform((v) => {
        if (v === "true")
            return true;
        if (v === "false")
            return false;
        return undefined;
    }),
    sortBy: zod_1.default
        .enum(["name", "email", "createdAt", "role"])
        .optional()
        .default("createdAt"),
    sortOrder: zod_1.default
        .string()
        .optional()
        .transform((v) => (v === "asc" ? 1 : -1)),
    company_id: objectIdSchema.optional(), // super_admin can filter by company
});
// ─── Params schema ────────────────────────────────────────
exports.userParamsSchema = zod_1.default.object({
    id: objectIdSchema,
});
// ─── Update user schema ───────────────────────────────────
exports.updateUserSchema = zod_1.default.object({
    name: zod_1.default.string().trim().min(2).max(100).optional(),
    is_active: zod_1.default.boolean().optional(),
    // only super_admin can change role — enforced in service
    role: zod_1.default
        .enum([
        "admin",
        "account",
        "site_management",
        "inventory",
        "sales",
        "report",
    ])
        .optional(),
});
const urlOrEmpty = zod_1.default
    .string()
    .trim()
    .url("Must be a valid URL")
    .or(zod_1.default.literal(""))
    .nullable()
    .optional();
exports.updateSocialMediaSchema = zod_1.default.object({
    social_media: zod_1.default
        .object({
        facebook: urlOrEmpty,
        instagram: urlOrEmpty,
        twitter: urlOrEmpty,
        youtube: urlOrEmpty,
        tiktok: urlOrEmpty,
        linkedin: urlOrEmpty,
        whatsapp: urlOrEmpty,
        pinterest: urlOrEmpty,
        website: urlOrEmpty,
    })
        .optional(),
});
//# sourceMappingURL=company.validation.js.map