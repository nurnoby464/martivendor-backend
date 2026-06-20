import { Request, Response } from "express";
export declare const createBanner: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getAllBanners: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getActiveBanners: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getBannerById: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateBanner: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const deleteBanner: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const toggleBannerStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const bulkUpdateOrders: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const deleteMultipleBanners: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=banner.controller.d.ts.map