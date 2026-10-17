"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.guardCustomer = void 0;
const appError_1 = require("./appError");
const jwtHelper_1 = require("../utils/jwtHelper");
const jwt_config_1 = require("../config/jwt.config");
const guardCustomer = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        // console.log(authHeader)
        if (!authHeader?.startsWith("Bearer")) {
            return next();
        }
        const formatRole = (role) => {
            return role
                .split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");
        };
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
        if (!["user", "customer"].includes(decoded.role)) {
            const role = formatRole(decoded.role);
            //   return ApiResponse.error(res,`You are ${decoded.role}. Only customer can order product`,400)
            throw new appError_1.AppError(`You are a ${role}. Only customers and user can order products`, 400);
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
exports.guardCustomer = guardCustomer;
//# sourceMappingURL=guardCustomer.js.map