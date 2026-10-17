import { z } from "zod";
import { ProductTag, ProductType } from "../product/product.interface";
export declare const productParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const suggestionsSchema: z.ZodObject<{
    search: z.ZodString;
}, z.core.$strip>;
export declare const productQuerySchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    limit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    search: z.ZodOptional<z.ZodString>;
    categorySlug: z.ZodOptional<z.ZodString>;
    productType: z.ZodOptional<z.ZodEnum<typeof ProductType>>;
    categoryId: z.ZodOptional<z.ZodString>;
    hasVariants: z.ZodPipe<z.ZodOptional<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>, z.ZodTransform<boolean | undefined, "true" | "false" | undefined>>;
    isActive: z.ZodPipe<z.ZodOptional<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>, z.ZodTransform<boolean | undefined, "true" | "false" | undefined>>;
    lowStock: z.ZodOptional<z.ZodEnum<{
        true: "true";
    }>>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        name: "name";
        createdAt: "createdAt";
        updatedAt: "updatedAt";
        stock: "stock";
        sellingPrice: "sellingPrice";
    }>>>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>>;
    tags: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodEnum<typeof ProductTag>, z.ZodArray<z.ZodEnum<typeof ProductTag>>]>, z.ZodTransform<ProductTag[], ProductTag | ProductTag[]>>>;
    discount: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    hasDiscount: z.ZodOptional<z.ZodPipe<z.ZodEnum<{
        true: "true";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "false">>>;
}, z.core.$strip>;
export type SuggestionsSchemaQuery = z.infer<typeof suggestionsSchema>;
export type GetProductParamsQuery = z.infer<typeof productParamsSchema>;
export type GetProductQueryInput = z.infer<typeof productQuerySchema>;
//# sourceMappingURL=public.validation.d.ts.map