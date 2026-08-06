"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorQuerySchema = exports.noteParamsSchema = exports.vendorParamsSchema = exports.addNoteSchema = exports.updateVendorSchema = exports.createVendorSchema = void 0;
// src/module/vendor/vendor.validation.ts
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
const objectId = zod_1.z
    .string()
    .refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
});
exports.createVendorSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .trim()
        .min(2, "Min 2 characters")
        .max(200, "Max 200 characters"),
    phone: zod_1.z.string().trim().min(1, "Phone is required"),
    email: zod_1.z
        .string()
        .trim()
        .transform((val) => (val === "" ? null : val))
        .pipe(zod_1.z.string().email("Invalid email").toLowerCase().nullable())
        .optional(),
    address: zod_1.z
        .string()
        .trim()
        .transform((val) => (val === "" ? null : val))
        .optional()
        .nullable(),
});
exports.updateVendorSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(200).optional(),
    phone: zod_1.z.string().trim().min(1).optional(),
    email: zod_1.z
        .string()
        .trim()
        .transform((v) => (v === "" ? null : v))
        .pipe(zod_1.z.string().email("Invalid email").toLowerCase().nullable())
        .optional(),
    address: zod_1.z
        .string()
        .trim()
        .transform((v) => (v === "" ? null : v))
        .optional()
        .nullable(),
    is_active: zod_1.z.boolean().optional(),
});
exports.addNoteSchema = zod_1.z.object({
    text: zod_1.z
        .string()
        .trim()
        .min(1, "Note text is required")
        .max(1000, "Max 1000 characters"),
});
exports.vendorParamsSchema = zod_1.z.object({
    id: objectId,
});
exports.noteParamsSchema = zod_1.z.object({
    id: objectId,
    noteId: objectId,
});
exports.vendorQuerySchema = zod_1.z.object({
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
        .transform((v) => v === "true"),
    sort_by: zod_1.z.enum(["name", "due", "createdAt"]).optional().default("createdAt"),
    sort_order: zod_1.z.enum(["asc", "desc"]).optional().default("desc"),
});
//# sourceMappingURL=vendor.validation.js.map