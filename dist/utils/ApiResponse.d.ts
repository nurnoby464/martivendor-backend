import { Response } from "express";
export declare class ApiResponse {
    static success(res: Response, data: any, message?: string, statusCode?: number, meta?: Record<string, unknown> | unknown[]): Response<any, Record<string, any>>;
    static created(res: Response, data: any, message?: string): Response<any, Record<string, any>>;
    static error(res: Response, message?: string, statusCode?: number, errors?: any): Response<any, Record<string, any>>;
    static paginated(res: Response, message: string | undefined, data: any, total: number, page: number, limit: number, meta?: Record<string, unknown> | unknown[]): Response<any, Record<string, any>>;
}
//# sourceMappingURL=ApiResponse.d.ts.map