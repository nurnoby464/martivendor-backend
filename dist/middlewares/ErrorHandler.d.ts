import { Request, Response, NextFunction } from 'express';
export declare const globalErrorHandler: (err: unknown, req: Request, res: Response, _next: NextFunction) => Response<any, Record<string, any>>;
export declare const notFoundHandler: (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=ErrorHandler.d.ts.map