import { UserRole } from "../module/user/user.interface";
import { Request, Response, NextFunction } from "express";
export declare const guard: (...allowedRoles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=guard.d.ts.map