"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateNavItemSchema = exports.ReorderNavItemsBodySchema = exports.ChangeNavItemOrderSchema = exports.UpdateParamsSchema = exports.DeleteNavItemSchema = exports.UpdateNavItemSchema = void 0;
// validations/navConfig.validation.ts
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
const isValidObjectId = (value) => mongoose_1.default.Types.ObjectId.isValid(value);
// ── Shared nav item shape ──
const NavItemSchema = zod_1.z
    .object({
    label: zod_1.z.string().min(1, "Label is required").trim(),
    keyword: zod_1.z.string().trim().optional(),
    sectionTitle: zod_1.z.string().trim().optional(),
    order: zod_1.z.number().int().positive(),
    isActiveInNav: zod_1.z.boolean(),
    showOnHomepage: zod_1.z.boolean(),
})
    .refine((data) => {
    if (data.showOnHomepage) {
        return !!data.keyword?.trim() && !!data.sectionTitle?.trim();
    }
    return true;
}, {
    message: "Category and section title are required when 'Show on homepage' is checked",
    path: ["showOnHomepage"],
});
// ── Create: full nav item, no _id yet ──
// ── Update: _id required, all fields optional except the refine rule ──
exports.UpdateNavItemSchema = zod_1.z
    .object({
    _id: zod_1.z.string().min(1, "_id is required").refine(isValidObjectId, {
        message: "_id must be a valid ObjectId",
    }),
    label: zod_1.z.string().min(1, "Label is required").trim().optional(),
    keyword: zod_1.z.string().trim().optional(),
    sectionTitle: zod_1.z.string().trim().optional(),
    order: zod_1.z.number().int().positive().optional(),
    isActiveInNav: zod_1.z.boolean().optional(),
    showOnHomepage: zod_1.z.boolean().optional(),
})
    .refine((data) => {
    if (data.showOnHomepage === true) {
        return !!data.keyword?.trim() && !!data.sectionTitle?.trim();
    }
    return true;
}, {
    message: "Category and section title are required when 'Show on homepage' is checked",
    path: ["showOnHomepage"],
});
// ── Delete: only _id needed ──
exports.DeleteNavItemSchema = zod_1.z.object({
    id: zod_1.z.string().min(1, "_id is required").refine(isValidObjectId, {
        message: "_id must be a valid ObjectId",
    }),
    navItemId: zod_1.z.string().min(1, "_id is required").refine(isValidObjectId, {
        message: "_id must be a valid ObjectId",
    }),
});
exports.UpdateParamsSchema = zod_1.z.object({
    id: zod_1.z.string().min(1, "_id is required").refine(isValidObjectId, {
        message: "_id must be a valid ObjectId",
    })
});
// ── Order change: array of { _id, order } pairs ──
exports.ChangeNavItemOrderSchema = zod_1.z.object({
    items: zod_1.z
        .array(zod_1.z.object({
        _id: zod_1.z.string().min(1, "_id is required"),
        order: zod_1.z.number().int().positive(),
    }))
        .min(1, "At least one item is required")
        .refine((items) => {
        const orders = items.map((i) => i.order);
        return new Set(orders).size === orders.length;
    }, { message: "Order values must be unique" }),
});
exports.ReorderNavItemsBodySchema = zod_1.z.object({
    navItems: zod_1.z
        .array(zod_1.z.object({
        _id: zod_1.z.string().min(1).refine(isValidObjectId, {
            message: "_id must be a valid ObjectId",
        }),
        order: zod_1.z.number().int().min(1),
    }))
        .min(1)
        .refine((items) => new Set(items.map((i) => i._id)).size === items.length, { message: "Duplicate _id values in navItems" }),
});
exports.CreateNavItemSchema = NavItemSchema;
//# sourceMappingURL=seller.header.validation.js.map