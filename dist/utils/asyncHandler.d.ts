import { Request, Response, NextFunction, RequestHandler } from 'express';
/**
 * Wraps an async controller and catches any thrown error.
 * - AppError   → forwarded to next() as-is (already structured)
 * - Any other  → wrapped in a generic 500 AppError first, then forwarded
 *
 * This guarantees the global error handler always receives an AppError.
 */
export declare const asyncHandler: (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=asyncHandler.d.ts.map