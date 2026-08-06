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
exports.getPublicMergedCategories = exports.getCategoryTree = exports.getAllCategories = exports.getProducts = void 0;
const PublicService = __importStar(require("./public.service"));
const ApiResponse_1 = require("../../utils/ApiResponse");
const asyncHandler_1 = require("../../utils/asyncHandler");
exports.getProducts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const query = req.validatedQuery;
    const { products, total } = await PublicService.getProducts(query);
    return ApiResponse_1.ApiResponse.paginated(res, "Product", products, total, query.page, query.limit);
});
const getAllCategories = async (req, res) => {
    const categories = await PublicService.getAllCategories(req);
    return ApiResponse_1.ApiResponse.success(res, categories, "Categories retrieved successfully");
};
exports.getAllCategories = getAllCategories;
exports.getCategoryTree = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const search = req.query.search;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { categories, total } = await PublicService.searchCategories({
        ...(search && { search }),
        skip,
        limit,
    });
    return ApiResponse_1.ApiResponse.paginated(res, "successfully", categories, total, page, limit);
});
exports.getPublicMergedCategories = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const search = req.query.search;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { categories, total } = await PublicService.getPublicMergedCategories({
        ...(search && { search }),
        page,
        limit,
    });
    return ApiResponse_1.ApiResponse.paginated(res, "successfully", categories, total, page, limit);
});
//# sourceMappingURL=public.controller.js.map