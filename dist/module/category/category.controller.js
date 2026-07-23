"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.getCategoryById = exports.getCategories = exports.getCategoryTree = exports.createCategory = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const CategoryService = __importStar(require("./category.service"));
// ─── Create Category ──────────────────────────────────────
exports.createCategory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const category = await CategoryService.createCategory({
        ...req.body, // Contains name, parent_id, image (URL)
        sellerId: req.user.sellerId,
        createdBy: req.user._id,
        req,
    });
    return ApiResponse_1.ApiResponse.created(res, category, "Category created successfully");
});
// ─── Get Category Tree ────────────────────────────────────
exports.getCategoryTree = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const search = req.query.search;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    console.log("sellerId", req.user.sellerId);
    const { categories, total } = await CategoryService.searchCategories({
        sellerId: req.user.sellerId,
        ...(search && { search }),
        skip,
        limit,
    });
    return ApiResponse_1.ApiResponse.paginated(res, "successfully", categories, total, page, limit);
});
// ─── Get All Categories ───────────────────────────────────
exports.getCategories = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const page = req.validatedQuery.page;
    const limit = req.validatedQuery.limit;
    const search = req.validatedQuery.search;
    const parent_id = req.validatedQuery.parent_id;
    const depth = req.validatedQuery.depth;
    const is_active = req.validatedQuery.is_active;
    const query = { page, limit, search, parent_id, depth, is_active };
    const { categories, total } = await CategoryService.getCategories({
        sellerId: req.user.sellerId,
        page,
        parent_id,
        depth,
        limit,
        search,
        is_active,
    });
    return ApiResponse_1.ApiResponse.paginated(res, "Category", categories, total, query.page, query.limit);
});
// ─── Get Single Category ──────────────────────────────────
exports.getCategoryById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const category = await CategoryService.getCategoryById({
        id: req.params.id,
        sellerId: req.user.sellerId,
    });
    return ApiResponse_1.ApiResponse.success(res, category);
});
// ─── Update Category ──────────────────────────────────────
exports.updateCategory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const category = await CategoryService.updateCategory({
        id: req.params.id,
        sellerId: req.user.sellerId,
        data: req.body, // Contains name, image (URL), is_active
        req,
    });
    return ApiResponse_1.ApiResponse.success(res, category, "Category updated successfully");
});
// ─── Delete Category ──────────────────────────────────────
exports.deleteCategory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const category = await CategoryService.deleteCategory({
        id: req.params.id,
        sellerId: req.user.sellerId,
        req,
    });
    return ApiResponse_1.ApiResponse.success(res, null, "Category deactivated successfully");
});
//# sourceMappingURL=category.controller.js.map