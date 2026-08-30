import express from "express";
import { AppError } from "./appError";
import { JwtHelper } from "../utils/jwtHelper";
import { jwtConfig } from "../config/jwt.config";
import { ApiResponse } from "../utils/ApiResponse";

export const guardCustomer: express.RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    // console.log(authHeader)
    if (!authHeader?.startsWith("Bearer")) {
      return next();
    }
    const formatRole = (role: string) => {
      return role
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };
    const token = authHeader?.split(" ")[1] as string;
    // decode token
    let decoded;
    try {
      decoded = JwtHelper.verifyToken({
        token,
        secret: jwtConfig.access.secret,
      });
    } catch (error: any) {
      if (error.name === "TokenExpiredError")
        throw new AppError("Assess token is expired", 401);
      throw new AppError("Invalid assess token", 401);
    }
    if (decoded.passwordChangedAt) {
      const tokenIssueAt = decoded.iat ?? 0 * 1000;
      const passwordChangeAt = decoded.passwordChangedAt;
      if (passwordChangeAt > tokenIssueAt) {
        throw new AppError("Password was changed. Please log in again", 401);
      }
    }
    if (decoded.role !== "customer") {
      const role = formatRole(decoded.role);
      //   return ApiResponse.error(res,`You are ${decoded.role}. Only customer can order product`,400)
      throw new AppError(
        `You are a ${role}. Only customers can order products`,
        400,
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
