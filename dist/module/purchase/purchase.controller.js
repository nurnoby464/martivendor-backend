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
exports.updateStock = exports.remove = exports.updatePayment = exports.getPurchaseById = exports.getPurchases = exports.createPurchase = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const PurchaseService = __importStar(require("./purchase.service"));
const mongoose_1 = __importDefault(require("mongoose"));
// ─── Create ───────────────────────────────────────────────
exports.createPurchase = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const company_id = new mongoose_1.default.Types.ObjectId(req.user.company_id);
    const createdBy = new mongoose_1.default.Types.ObjectId(req.user._id);
    const purchase = await PurchaseService.createPurchase({ ...req.body, company_id, createdBy }, req);
    return ApiResponse_1.ApiResponse.created(res, purchase, "Purchase created successfully");
});
// ─── Get all ──────────────────────────────────────────────
exports.getPurchases = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const company_id = new mongoose_1.default.Types.ObjectId(req.user.company_id);
    const query = req.validatedQuery;
    const { purchases, total } = await PurchaseService.getPurchases(company_id, req.validatedQuery);
    return ApiResponse_1.ApiResponse.paginated(res, "Purchase get successfully!", purchases, total, query.page, query.limit);
});
// ─── Get one ──────────────────────────────────────────────
exports.getPurchaseById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const purchase = await PurchaseService.getPurchaseById({
        id: req.params.id,
        company_id: req.user.company_id,
    });
    return ApiResponse_1.ApiResponse.success(res, purchase);
});
exports.updatePayment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const company_id = new mongoose_1.default.Types.ObjectId(req.user.company_id);
    const updatedPurchase = await PurchaseService.updatePayment(req.params.id, company_id, req.body, req);
    return ApiResponse_1.ApiResponse.success(res, updatedPurchase, "Purchase payment updated successfully");
});
exports.remove = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const company_id = new mongoose_1.default.Types.ObjectId(req.user.company_id);
    await PurchaseService.deletePurchase(req.params.id, company_id, req);
    return ApiResponse_1.ApiResponse.success(res, null, "Purchase deleted successfully");
});
exports.updateStock = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // const company_id = new mongoose.Types.ObjectId(req.user.company_id!);
    const result = await PurchaseService.updateStock(req);
    return ApiResponse_1.ApiResponse.success(res, result, "Purchase deleted successfully");
});
//# sourceMappingURL=purchase.controller.js.map