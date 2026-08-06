"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendOPT = exports.verifySellerOPT = exports.updateProfile = exports.registerSeller = exports.registerCustomer = exports.updatePassword = exports.getMe = exports.removeSession = exports.refresh = exports.logout = exports.login = void 0;
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
exports.login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { refreshToken, ...result } = await auth_service_1.AuthServices.login(req.body, req);
    res.cookie("multiVendorRefreshToken", refreshToken, COOKIE_OPTIONS);
    return ApiResponse_1.ApiResponse.success(res, result, "Login successfully");
});
// ─── Logout ───────────────────────────────────────────────
exports.logout = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const refreshToken = req.cookies?.multiVendorRefreshToken;
    await auth_service_1.AuthServices.logout(refreshToken);
    // clear the cookie
    res.clearCookie("multiVendorRefreshToken", COOKIE_OPTIONS);
    return ApiResponse_1.ApiResponse.success(res, null, "Logged out successfully");
});
// ─── Refresh access token ─────────────────────────────────
exports.refresh = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const refreshToken = req.cookies?.multiVendorRefreshToken;
    if (!refreshToken)
        throw new appError_1.AppError("No refresh token provided", 401);
    const result = await auth_service_1.AuthServices.refresh(refreshToken);
    return ApiResponse_1.ApiResponse.success(res, result, "Token refreshed");
});
exports.removeSession = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, userId } = req.params;
    await auth_service_1.AuthServices.removeSession(sessionId, userId);
    return ApiResponse_1.ApiResponse.success(res, null, "Session removed. You can now log in.");
});
exports.getMe = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!new mongoose_1.Types.ObjectId(req.user._id))
        throw new appError_1.AppError("Invalid user id", 401);
    if (!new mongoose_1.Types.ObjectId(req.user.sessionId))
        throw new appError_1.AppError("Invalid session id", 401);
    const result = await auth_service_1.AuthServices.getMe(req.user._id, new mongoose_1.Types.ObjectId(req.user.sessionId));
    // res.cookie("multiVendorRefreshToken", refreshToken, COOKIE_OPTIONS);
    return ApiResponse_1.ApiResponse.success(res, result, "Load own info");
});
exports.updatePassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
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
const registerSeller = async (req, res) => {
    const user = await auth_service_1.AuthServices.registerSeller(req.body);
    return ApiResponse_1.ApiResponse.created(res, user, "Seller Registration Successfully");
};
exports.registerSeller = registerSeller;
const updateProfile = async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId)
        throw new appError_1.AppError("Company ID not found in user data", 400);
    const user = await auth_service_1.AuthServices.updateProfile(sellerId, req.user._id, req.body);
    return ApiResponse_1.ApiResponse.created(res, user, "Profile update Successfully");
};
exports.updateProfile = updateProfile;
const verifySellerOPT = async (req, res) => {
    const user = await auth_service_1.AuthServices.verifySellerOPT(req.body);
    return ApiResponse_1.ApiResponse.success(res, user, "OPT match Successfully");
};
exports.verifySellerOPT = verifySellerOPT;
const resendOPT = async (req, res) => {
    const user = await auth_service_1.AuthServices.resendOPT(req.body);
    return ApiResponse_1.ApiResponse.success(res, user, "OPT send Successfully");
};
exports.resendOPT = resendOPT;
// export const AuthController = {
//   login,
//   logout,
//   refresh,
//   removeSession,
//   updatePassword,
//   registerCustomer,
//   getMe,
//   updateProfile,
// };
//# sourceMappingURL=auth.controller.js.map