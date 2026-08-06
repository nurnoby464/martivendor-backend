"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = void 0;
const appError_1 = require("../middlewares/appError");
/**
 * Wraps an async controller and catches any thrown error.
 * - AppError   → forwarded to next() as-is (already structured)
 * - Any other  → wrapped in a generic 500 AppError first, then forwarded
 *
 * This guarantees the global error handler always receives an AppError.
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((err) => {
            if (err instanceof appError_1.AppError) {
                // Already structured — pass straight through
                return next(err);
            }
            // Unknown error (Mongoose driver crash, typo, etc.)
            // Wrap it so the global handler always gets a consistent shape
            const wrapped = new appError_1.AppError(err instanceof Error ? err.message : 'An unexpected error occurred', 500, false);
            return next(wrapped);
        });
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=asyncHandler.js.map