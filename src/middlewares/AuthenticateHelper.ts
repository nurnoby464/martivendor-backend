import express from "express";
import { AppError } from "./appError";
import { JwtHelper } from "../utils/jwtHelper";
import { jwtConfig } from "../config/jwt.config";
import Session from "../module/auth/auth.schema";
import { Types } from "mongoose";
import { resendOPT } from "../module/auth/auth.controller";
import { unknown } from "zod";
import { UserRole } from "../module/user/user.interface";

export const authenticate: express.RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    // console.log(authHeader)
    if (!authHeader?.startsWith("Bearer")) {
      throw new AppError("Access Token is missing", 401);
    }
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
    req.user = {
      _id: decoded._id,
      sellerId: decoded.sellerId,
      sessionId: decoded.sessionId,
      profileId: decoded.profileId,
      profileType: decoded.profileType,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
      passwordChangedAt: decoded.passwordChangedAt,
    };
    next();
  } catch (error) {
    next(error);
  }
};

export const verifySession: express.RequestHandler = async (req, res, next) => {
  try {
    const session = await Session.findOne({
      _id: new Types.ObjectId(req.user.sessionId),
      valid: true,
    }).lean();

    if (!session)
      throw new AppError("Session expired. Please log in again", 401);

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth: express.RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer")) {
      next();
    }

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
    req.user = {
      _id: decoded._id,
      sellerId: decoded.sellerId,
      sessionId: decoded.sessionId,
      profileId: decoded.profileId,
      profileType: decoded.profileType,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
      passwordChangedAt: decoded.passwordChangedAt,
    };
    next();
  } catch (error) {
    next();
  }
};

export const optionalAuthForUser: express.RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const role = req.body.role;
    if (role === "user") {
      next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer")) {
      throw new AppError("Access Token is missing", 401);
    }

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
    if (!["super_admin", "seller"].includes(decoded.role)) {
      throw new AppError("Unauthorized access", 403);
    }
    req.user = {
      _id: decoded._id,
      sellerId: decoded.sellerId,
      sessionId: decoded.sessionId,
      profileId: decoded.profileId,
      profileType: decoded.profileType,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
      passwordChangedAt: decoded.passwordChangedAt,
    };
    next();
  } catch (error) {
    next(error);
  }
};
