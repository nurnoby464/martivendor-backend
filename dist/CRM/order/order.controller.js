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
exports.getMyOrders = exports.getAllOrder = exports.createOrder = void 0;
const ApiResponse_1 = require("../../utils/ApiResponse");
const asyncHandler_1 = require("../../utils/asyncHandler");
const OrderServices = __importStar(require("./order.service"));
exports.createOrder = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.company?._id;
    if (!sellerId) {
        return ApiResponse_1.ApiResponse.error(res, "Created Order place failed", 400);
    }
    const result = await OrderServices.createOrder({
        sellerId,
        input: req.body,
    });
    return ApiResponse_1.ApiResponse.created(res, result, "Order created successfully");
});
exports.getAllOrder = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.company?._id;
    const limit = req.validatedQuery.limit;
    const page = req.validatedQuery.page;
    const sortBy = req.validatedQuery.sortBy;
    const search = req.validatedQuery.search;
    const sortOrder = req.validatedQuery.sortOrder;
    const orderStatus = req.validatedQuery.orderStatus;
    const paymentStatus = req.validatedQuery.paymentStatus;
    const customerId = req.validatedQuery.customerId;
    if (!sellerId) {
        return ApiResponse_1.ApiResponse.error(res, "Created Order place failed", 400);
    }
    const query = {
        limit,
        page,
        sortBy,
        sortOrder,
        search,
        orderStatus,
        paymentStatus,
        customerId,
    };
    const { orders, total, orderStatusCounts } = await OrderServices.getAllOrder(sellerId, query);
    return ApiResponse_1.ApiResponse.paginated(res, "Order fetched successfully", orders, total, page, limit, orderStatusCounts);
});
exports.getMyOrders = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const customerId = req.user.profileId;
    const sellerId = req.user.sellerId;
    if (!sellerId) {
        return ApiResponse_1.ApiResponse.error(res, "Company not found", 404);
    }
    const { page, limit, order_status, search } = req.validatedQuery;
    const { orders, total, statusCounts } = await OrderServices.getMyOrders(customerId, sellerId, req.validatedQuery);
    return ApiResponse_1.ApiResponse.paginated(res, "My Orders fetched successfully", orders, total, page, limit);
});
//# sourceMappingURL=order.controller.js.map