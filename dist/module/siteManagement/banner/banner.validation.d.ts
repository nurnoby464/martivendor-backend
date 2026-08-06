import { z } from "zod";
export declare const createBannerSchema: z.ZodObject<{
    text: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    imageUrl: z.ZodString;
    imagePublicId: z.ZodOptional<z.ZodString>;
    active: z.ZodDefault<z.ZodBoolean>;
    order: z.ZodDefault<z.ZodNumber>;
    linkUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    startDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    endDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const BannerParams: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const updateBannerSchema: z.ZodObject<{
    text: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    imageUrl: z.ZodOptional<z.ZodString>;
    imagePublicId: z.ZodOptional<z.ZodString>;
    active: z.ZodOptional<z.ZodBoolean>;
    order: z.ZodOptional<z.ZodNumber>;
    linkUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    startDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    endDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const getBannersQuerySchema: z.ZodObject<{
    active: z.ZodOptional<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>;
    page: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>>;
    limit: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>>;
    sortBy: z.ZodDefault<z.ZodEnum<{
        createdAt: "createdAt";
        updatedAt: "updatedAt";
        order: "order";
    }>>;
    sortOrder: z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
}, z.core.$strip>;
export declare const deleteBannerSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const getBannerSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const bulkUpdateBannersSchema: z.ZodObject<{
    banners: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        active: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type CreateBannerInput = z.infer<typeof createBannerSchema>;
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;
export type GetBannersQuery = z.infer<typeof getBannersQuerySchema>;
//# sourceMappingURL=banner.validation.d.ts.map