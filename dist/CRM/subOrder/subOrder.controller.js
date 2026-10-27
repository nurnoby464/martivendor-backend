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
exports.getSellerOrderById = exports.getSellerOrders = void 0;
const mongoose_1 = require("mongoose");
const asyncHandler_1 = require("../../utils/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const appError_1 = require("../../middlewares/appError");
const SubOrderServices = __importStar(require("./subOrder.service"));
exports.getSellerOrders = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const rawSellerId = req.user.sellerId;
    if (!rawSellerId || !mongoose_1.Types.ObjectId.isValid(String(rawSellerId))) {
        throw new appError_1.AppError("Seller not found, unauthorized access", 403);
    }
    const sellerId = new mongoose_1.Types.ObjectId(String(rawSellerId));
    const query = req.validatedQuery;
    const { orders, total, statusCounts } = await SubOrderServices.getSellerOrders(sellerId, query);
    return ApiResponse_1.ApiResponse.paginated(res, "Orders fetched successfully", orders, total, query.page, query.limit, { statusCounts });
});
exports.getSellerOrderById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId || !mongoose_1.Types.ObjectId.isValid(String(sellerId))) {
        throw new appError_1.AppError("Unauthorized access. Seller id not found", 403);
    }
    const result = await SubOrderServices.getSellerOrderById(req.params.orderId, sellerId);
    return ApiResponse_1.ApiResponse.success(res, result, "Order fetched successfully");
});
//# sourceMappingURL=subOrder.controller.js.map