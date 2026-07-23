import { asyncHandler } from "../../utils/asyncHandler";
import { Request, Response } from "express";
import { AuthServices } from "./auth.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { AppError } from "../../middlewares/appError";
import { Types } from "mongoose";

const isProduction = process.env.NODE_ENV === "production";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  // sameSite: (process.env.NODE_ENV === "production" ? "strict" : "lax") as
  //   | "strict"
  //   | "lax",
  sameSite: isProduction ? ("none" as "none") : ("lax" as "lax"),
  maxAge: 1000 * 60 * 60 * 24 * 30,
  path: "/",
};

const login = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken, ...result } = await AuthServices.login(req.body, req);
  res.cookie("eMultiRefreshToken", refreshToken, COOKIE_OPTIONS);
  return ApiResponse.success(res, result, "Login successfully");
});

// ─── Logout ───────────────────────────────────────────────
const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.eMultiRefreshToken;
  await AuthServices.logout(refreshToken);

  // clear the cookie
  res.clearCookie("eMultiRefreshToken", COOKIE_OPTIONS);

  return ApiResponse.success(res, null, "Logged out successfully");
});

// ─── Refresh access token ─────────────────────────────────
const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.eMultiRefreshToken;
  if (!refreshToken) throw new AppError("No refresh token provided", 401);

  const result = await AuthServices.refresh(refreshToken);
  return ApiResponse.success(res, result, "Token refreshed");
});

const removeSession = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId, userId } = req.params;
  await AuthServices.removeSession(sessionId as string, userId as string);
  return ApiResponse.success(res, null, "Session removed. You can now log in.");
});

const getMe = asyncHandler(async (req: Request, res: Response) => {
  const  { refreshToken, ...result } = await AuthServices.getMe(req.user._id.toString(),req.user.sessionId.toString());
  res.cookie("eMultiRefreshToken", refreshToken, COOKIE_OPTIONS);
  return ApiResponse.success(res, result,"Load own info");
});

const updatePassword = asyncHandler(async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const result = await AuthServices.updatePassword({
    oldPassword,
    newPassword,
    userId: req.user._id.toString(),
    sessionId: req.user.sessionId,
  });
  return ApiResponse.success(res, null, result.message);
});

export const registerCustomer = async (req: Request, res: Response) => {
  const sellerId = new Types.ObjectId(req.company?._id); // set by resolveCompany middleware
  const user = await AuthServices.registerCustomer(sellerId, req.body);
  return ApiResponse.created(res, user, "Registration Successfully");
};

export const updateProfile = async (req: Request, res: Response) => {
  const sellerId = req.user.sellerId;
  if (!sellerId) throw new AppError("Company ID not found in user data", 400);
  const user = await AuthServices.updateProfile(sellerId,req.user._id, req.body);
  return ApiResponse.created(res, user, "Profile update Successfully");
};

export const AuthController = {
  login,
  logout,
  refresh,
  removeSession,
  updatePassword,
  registerCustomer,
  getMe,
  updateProfile,
};
