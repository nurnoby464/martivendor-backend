"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthForUser = exports.optionalAuth = exports.verifySession = exports.authenticate = void 0;
const appError_1 = require("./appError");
const jwtHelper_1 = require("../utils/jwtHelper");
const jwt_config_1 = require("../config/jwt.config");
const auth_schema_1 = __importDefault(require("../module/auth/auth.schema"));
const mongoose_1 = require("mongoose");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        // console.log(authHeader)
        if (!authHeader?.startsWith("Bearer")) {
            throw new appError_1.AppError("Access Token is missing", 401);
        }
        const token = authHeader?.split(" ")[1];
        // decode token
        let decoded;
        try {
            decoded = jwtHelper_1.JwtHelper.verifyToken({
                token,
                secret: jwt_config_1.jwtConfig.access.secret,
            });
        }
        catch (error) {
            if (error.name === "TokenExpiredError")
                throw new appError_1.AppError("Assess token is expired", 401);
            throw new appError_1.AppError("Invalid assess token", 401);
        }
        if (decoded.passwordChangedAt) {
            const tokenIssueAt = decoded.iat ?? 0 * 1000;
            const passwordChangeAt = decoded.passwordChangedAt;
            if (passwordChangeAt > tokenIssueAt) {
                throw new appError_1.AppError("Password was changed. Please log in again", 401);
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
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
const verifySession = async (req, res, next) => {
    try {
        const session = await auth_schema_1.default.findOne({
            _id: new mongoose_1.Types.ObjectId(req.user.sessionId),
            valid: true,
        }).lean();
        if (!session)
            throw new appError_1.AppError("Session expired. Please log in again", 401);
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.verifySession = verifySession;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer")) {
            next();
        }
        const token = authHeader?.split(" ")[1];
        // decode token
        let decoded;
        try {
            decoded = jwtHelper_1.JwtHelper.verifyToken({
                token,
                secret: jwt_config_1.jwtConfig.access.secret,
            });
        }
        catch (error) {
            if (error.name === "TokenExpiredError")
                throw new appError_1.AppError("Assess token is expired", 401);
            throw new appError_1.AppError("Invalid assess token", 401);
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
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
const optionalAuthForUser = async (req, res, next) => {
    try {
        const role = req.body.role;
        if (role === "user") {
            next();
        }
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer")) {
            throw new appError_1.AppError("Access Token is missing", 401);
        }
        const token = authHeader?.split(" ")[1];
        // decode token
        let decoded;
        try {
            decoded = jwtHelper_1.JwtHelper.verifyToken({
                token,
                secret: jwt_config_1.jwtConfig.access.secret,
            });
        }
        catch (error) {
            if (error.name === "TokenExpiredError")
                throw new appError_1.AppError("Assess token is expired", 401);
            throw new appError_1.AppError("Invalid assess token", 401);
        }
        if (!["super_admin", "seller"].includes(decoded.role)) {
            throw new appError_1.AppError("Unauthorized access", 403);
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
    }
    catch (error) {
        next(error);
    }
};
exports.optionalAuthForUser = optionalAuthForUser;
//# sourceMappingURL=AuthenticateHelper.js.map