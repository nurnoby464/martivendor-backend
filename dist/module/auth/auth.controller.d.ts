import { Request, Response } from "express";
export declare const login: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const logout: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const refresh: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const removeSession: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getMe: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updatePassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const registerCustomer: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const registerSeller: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const verifySellerOPT: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const resendOPT: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=auth.controller.d.ts.map