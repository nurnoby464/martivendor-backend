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
exports.getProductView = exports.deleteProduct = exports.updateProduct = exports.getProductBySlug = exports.getProductById = exports.getProducts = exports.createProduct = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const ProductService = __importStar(require("./product.service"));
const product_validation_1 = require("./product.validation");
const appError_1 = require("../../middlewares/appError");
// ═══════════════════════════════════════════════════════════
// PRODUCT
// ═══════════════════════════════════════════════════════════
exports.createProduct = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const input = product_validation_1.createProductSchema.parse(req.body);
    // Populated by auth middleware — same pattern as your existing `getMe`
    // endpoint (role-based access, field-level selection).
    const sellerId = req.user?.sellerId;
    const userId = req.user?._id;
    if (!sellerId || !userId) {
        throw new appError_1.AppError("Only authenticated sellers can create products", 403);
    }
    const product = await ProductService.createProduct({ sellerId, createdBy: userId }, input);
    res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product,
    });
});
exports.getProducts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const query = req.validatedQuery;
    console.log("product controller query", query);
    const { products, total } = await ProductService.getProducts({
        sellerId: req.user.sellerId,
        ...query,
    });
    return ApiResponse_1.ApiResponse.paginated(res, "Product", products, total, query.page, query.limit);
});
exports.getProductById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await ProductService.getProductById({
        id: req.params.id,
        sellerId: req.user.sellerId,
    });
    return ApiResponse_1.ApiResponse.success(res, result);
});
exports.getProductBySlug = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await ProductService.getProductBySlug({
        slug: req.params.slug,
        // sellerId: req.user.sellerId!,
    });
    return ApiResponse_1.ApiResponse.success(res, result);
});
exports.updateProduct = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const product = await ProductService.updateProduct({
        id: req.params.id,
        sellerId: req.user.sellerId,
        data: req.body,
        req,
    });
    return ApiResponse_1.ApiResponse.success(res, product, "Product updated successfully");
});
exports.deleteProduct = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const product = await ProductService.deleteProduct({
        id: req.params.id,
        sellerId: req.user.sellerId,
        req,
    });
    return ApiResponse_1.ApiResponse.success(res, null, "Product deactivated successfully");
});
exports.getProductView = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const product = await ProductService.getProductView(req.validatedQuery);
    return ApiResponse_1.ApiResponse.success(res, product, "Product details fetch successfully");
});
// ═══════════════════════════════════════════════════════════
// VARIANT
// ═══════════════════════════════════════════════════════════
//# sourceMappingURL=product.controller.js.map