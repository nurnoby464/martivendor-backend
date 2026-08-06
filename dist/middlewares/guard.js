"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.guard = void 0;
const appError_1 = require("./appError");
const guard = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new appError_1.AppError("Not Authenticate", 401);
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new appError_1.AppError(`Access denied. Required roles: ${allowedRoles.join(", ")}`, 403));
        }
        next();
    };
};
exports.guard = guard;
//# sourceMappingURL=guard.js.map