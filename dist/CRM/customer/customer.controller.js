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
exports.createCustomer = exports.getCustomerList = void 0;
const ApiResponse_1 = require("../../utils/ApiResponse");
const asyncHandler_1 = require("../../utils/asyncHandler");
const CustomerServices = __importStar(require("./customer.service"));
const appError_1 = require("../../middlewares/appError");
exports.getCustomerList = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId) {
        throw new appError_1.AppError("Company not found", 404);
    }
    const { customers, total, page, limit } = await CustomerServices.getCustomerList(req.validatedQuery, sellerId);
    return ApiResponse_1.ApiResponse.paginated(res, "sales created successfully", customers, total, page, limit);
});
exports.createCustomer = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId) {
        throw new appError_1.AppError("Now found seller.", 404);
    }
    const result = await CustomerServices.createCustomer(sellerId, req.body);
    return ApiResponse_1.ApiResponse.success(res, result, "Customer created successfully");
});
//# sourceMappingURL=customer.controller.js.map