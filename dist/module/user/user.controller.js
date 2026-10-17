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
exports.getUserDetails = exports.createSuperAdmin = exports.deleteCompany = exports.updateCompany = exports.getCompanyById = exports.getUserStats = exports.getAllCompanies = exports.createCompany = exports.toggleStatus = exports.remove = exports.list = exports.getById = exports.createUser = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const UserService = __importStar(require("./user.service"));
const ApiResponse_1 = require("../../utils/ApiResponse");
const appError_1 = require("../../middlewares/appError");
// ─── POST /users ──────────────────────────────────────────
exports.createUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = await UserService.createUser(req.body);
    return ApiResponse_1.ApiResponse.created(res, user, "User created successfully");
});
// ─── GET /users/:id ───────────────────────────────────────
exports.getById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = req.params.id;
    const user = await UserService.getUserById(id);
    return ApiResponse_1.ApiResponse.success(res, user);
});
// ─── GET /users ───────────────────────────────────────────
exports.list = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { users, total, page, limit } = await UserService.listUsers(req.query);
    return ApiResponse_1.ApiResponse.paginated(res, "User list fetch successfully", users, total, page, limit);
});
// ─── DELETE /users/:id ────────────────────────────────────
exports.remove = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = req.params.id;
    const requestor = req.user;
    if (requestor.role !== "super_admin" && requestor.role !== "admin") {
        throw new appError_1.AppError("You do not have permission to delete users", 403);
    }
    await UserService.deleteUser(id, requestor);
    return ApiResponse_1.ApiResponse.success(res, null, "User deleted successfully");
});
// ─── PATCH /users/:id/status ──────────────────────────────
exports.toggleStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = req.params.id;
    const user = await UserService.toggleUserStatus(id, req.user);
    return ApiResponse_1.ApiResponse.success(res, user, "User status updated");
});
// create company
exports.createCompany = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const company = await UserService.createCompany(req.body, req);
    return ApiResponse_1.ApiResponse.created(res, company, "Company created successfully");
});
exports.getAllCompanies = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await UserService.getAllCompanies(req.validatedQuery);
    return ApiResponse_1.ApiResponse.success(res, result, "Companies fetched successfully");
});
exports.getUserStats = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { stats, users, total, page, limit } = await UserService.getUserStats(req.validatedQuery);
    return ApiResponse_1.ApiResponse.paginated(res, "users stats fetched successfully", users, total, page, limit, { stats });
});
exports.getCompanyById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await UserService.getCompanyById(req.params.id, req);
    return ApiResponse_1.ApiResponse.success(res, result, "Company fetched successfully");
});
exports.updateCompany = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await UserService.updateCompany(req.params.id, req.body, req);
    return ApiResponse_1.ApiResponse.success(res, result, "Company updated successfully");
});
exports.deleteCompany = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await UserService.deleteCompany(req.params.id, req);
    return ApiResponse_1.ApiResponse.success(res, null, "Company deleted successfully");
});
exports.createSuperAdmin = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await UserService.createSuperAdmin(req.body);
    return ApiResponse_1.ApiResponse.created(res, result, "Super admin created successfully");
});
exports.getUserDetails = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await UserService.getUserDetails(req.validatedQuery);
    return ApiResponse_1.ApiResponse.success(res, result, "User details fetched successfully");
});
//# sourceMappingURL=user.controller.js.map