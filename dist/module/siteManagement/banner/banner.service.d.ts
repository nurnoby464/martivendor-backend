import { IBanner, IBannerDocument, IBannerQueryParams } from "../banner/banner.interface";
import { Types } from "mongoose";
export declare const createBanner: (companyId: Types.ObjectId, bannerData: Partial<IBanner>) => Promise<IBannerDocument>;
export declare const getAllBanners: (companyId: Types.ObjectId, params: IBannerQueryParams) => Promise<{
    success: boolean;
    data: (IBannerDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}>;
export declare const getActiveBanners: (companyId: Types.ObjectId) => Promise<IBannerDocument[]>;
export declare const getBannerById: (id: string, companyId: Types.ObjectId) => Promise<IBannerDocument | null>;
export declare const updateBanner: (id: string, companyId: Types.ObjectId, updateData: Partial<IBanner>) => Promise<IBannerDocument | null>;
export declare const deleteBanner: (id: string, companyId: Types.ObjectId) => Promise<IBannerDocument | null>;
export declare const bulkUpdateOrders: (companyId: Types.ObjectId, updates: Array<{
    id: string;
    order: number;
    active?: boolean;
}>) => Promise<void>;
export declare const toggleBannerStatus: (id: string, companyId: Types.ObjectId) => Promise<IBannerDocument | null>;
export declare const deleteMultipleBanners: (companyId: Types.ObjectId, ids: string[]) => Promise<number>;
//# sourceMappingURL=banner.service.d.ts.map