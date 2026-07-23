import { UserRole } from "../module/user/user.interface";
import { Request, Response, NextFunction } from "express";
import { AppError } from "./appError";
export const guard = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("Not Authenticate", 401);
    }
    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return next(
        new AppError(
          `Access denied. Required roles: ${allowedRoles.join(", ")}`,
          403,
        ),
      );
    }
    next();
  };
};
