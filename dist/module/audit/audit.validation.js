"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCompanySchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createCompanySchema = zod_1.default.object({
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
});
//# sourceMappingURL=audit.validation.js.map