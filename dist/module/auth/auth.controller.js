"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = exports.updateProfile = exports.registerCustomer = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const auth_service_1 = require("./auth.service");
const ApiResponse_1 = require("../../utils/ApiResponse");
const appError_1 = require("../../middlewares/appError");
const mongoose_1 = require("mongoose");
const isProduction = process.env.NODE_ENV === "production";
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isProduction,
    // sameSite: (process.env.NODE_ENV === "production" ? "strict" : "lax") as
    //   | "strict"
    //   | "lax",
    sameSite: isProduction ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 30,
    path: "/",
};
const login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { refreshToken, ...result } = await auth_service_1.AuthServices.login(req.body, req);
    res.cookie("eMultiRefreshToken", refreshToken, COOKIE_OPTIONS);
    return ApiResponse_1.ApiResponse.success(res, result, "Login successfully");
});
// ─── Logout ───────────────────────────────────────────────
const logout = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const refreshToken = req.cookies?.eMultiRefreshToken;
    await auth_service_1.AuthServices.logout(refreshToken);
    // clear the cookie
    res.clearCookie("eMultiRefreshToken", COOKIE_OPTIONS);
    return ApiResponse_1.ApiResponse.success(res, null, "Logged out successfully");
});
// ─── Refresh access token ─────────────────────────────────
const refresh = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const refreshToken = req.cookies?.eMultiRefreshToken;
    if (!refreshToken)
        throw new appError_1.AppError("No refresh token provided", 401);
    const result = await auth_service_1.AuthServices.refresh(refreshToken);
    return ApiResponse_1.ApiResponse.success(res, result, "Token refreshed");
});
const removeSession = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, userId } = req.params;
    await auth_service_1.AuthServices.removeSession(sessionId, userId);
    return ApiResponse_1.ApiResponse.success(res, null, "Session removed. You can now log in.");
});
const getMe = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { refreshToken, ...result } = await auth_service_1.AuthServices.getMe(req.user._id.toString(), req.user.sessionId.toString());
    res.cookie("eMultiRefreshToken", refreshToken, COOKIE_OPTIONS);
    return ApiResponse_1.ApiResponse.success(res, result, "Load own info");
});
const updatePassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const result = await auth_service_1.AuthServices.updatePassword({
        oldPassword,
        newPassword,
        userId: req.user._id.toString(),
        sessionId: req.user.sessionId,
    });
    return ApiResponse_1.ApiResponse.success(res, null, result.message);
});
const registerCustomer = async (req, res) => {
    const sellerId = new mongoose_1.Types.ObjectId(req.company?._id); // set by resolveCompany middleware
    const user = await auth_service_1.AuthServices.registerCustomer(sellerId, req.body);
    return ApiResponse_1.ApiResponse.created(res, user, "Registration Successfully");
};
exports.registerCustomer = registerCustomer;
const updateProfile = async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId)
        throw new appError_1.AppError("Company ID not found in user data", 400);
    const user = await auth_service_1.AuthServices.updateProfile(sellerId, req.user._id, req.body);
    return ApiResponse_1.ApiResponse.created(res, user, "Profile update Successfully");
};
exports.updateProfile = updateProfile;
exports.AuthController = {
    login,
    logout,
    refresh,
    removeSession,
    updatePassword,
    registerCustomer: exports.registerCustomer,
    getMe,
    updateProfile: exports.updateProfile,
};
//# sourceMappingURL=auth.controller.js.map