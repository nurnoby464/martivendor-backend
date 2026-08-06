import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
interface ValidateSchemas {
    body?: ZodSchema;
    params?: ZodSchema;
    query?: ZodSchema;
}
export declare const validate: (schemas: ValidateSchemas) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export {};
//# sourceMappingURL=validate.d.ts.map