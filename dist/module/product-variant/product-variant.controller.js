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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyInventory = exports.editProductVariant = exports.getAllProductWithVariant = exports.deleteVariant = exports.updateVariant = exports.getVariantById = exports.getVariants = exports.createVariant = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const ProductVariantServices = __importStar(require("./product-variant.service"));
const mongoose_1 = __importDefault(require("mongoose"));
const appError_1 = require("../../middlewares/appError");
exports.createVariant = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = new mongoose_1.default.Types.ObjectId(req.user.sellerId);
    const variant = await ProductVariantServices.createVariant({
        ...req.body,
        productId: req.params.id,
        sellerId,
    }, req);
    return ApiResponse_1.ApiResponse.created(res, variant, "Variant created successfully");
});
exports.getVariants = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const variants = await ProductVariantServices.getVariants({
        productId: req.params.id,
        sellerId: req.user.sellerId,
    });
    return ApiResponse_1.ApiResponse.success(res, variants);
});
exports.getVariantById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = new mongoose_1.default.Types.ObjectId(req.user.sellerId);
    const variant = await ProductVariantServices.getVariantById(req.params.variantId, sellerId);
    ApiResponse_1.ApiResponse.success(res, variant, "Variant fetched successfully");
});
exports.updateVariant = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = new mongoose_1.default.Types.ObjectId(req.user.sellerId);
    const variant = await ProductVariantServices.updateVariant(req.params.variantId, sellerId, req.body, req);
    return ApiResponse_1.ApiResponse.success(res, variant, "Variant updated successfully");
});
exports.deleteVariant = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const variant = await ProductVariantServices.deleteVariant({
        id: req.params.variantId,
        productId: req.params.id,
        sellerId: req.user.sellerId,
        req,
    });
    return ApiResponse_1.ApiResponse.success(res, null, "Variant deactivated successfully");
});
exports.getAllProductWithVariant = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { data, total, query } = await ProductVariantServices.getAllProductWithVariant({ req });
    return ApiResponse_1.ApiResponse.paginated(res, "Get Product with variant successfully", data, total, query.page, query.limit);
});
exports.editProductVariant = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await ProductVariantServices.editProductVariant(req);
    return ApiResponse_1.ApiResponse.success(res, result, "Variant updated successfully");
});
exports.getMyInventory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId) {
        throw new appError_1.AppError("unauthorized access. You have't seller Id", 403);
    }
    const { data, page, limit, totalCount } = await ProductVariantServices.getMyInventory(sellerId, req.validatedQuery);
    return ApiResponse_1.ApiResponse.paginated(res, "My inventory get  successfully", data, totalCount, page, limit);
});
//# sourceMappingURL=product-variant.controller.js.map