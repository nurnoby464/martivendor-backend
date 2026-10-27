import { z } from "zod";
import { ProductTag, ProductType } from "./product.interface";
export declare const updateProductSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    images: z.ZodOptional<z.ZodArray<z.ZodString>>;
    buyingPrice: z.ZodOptional<z.ZodNumber>;
    sellingPrice: z.ZodOptional<z.ZodNumber>;
    stock: z.ZodOptional<z.ZodNumber>;
    lowStockAlert: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const productParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const productSlugParamsSchema: z.ZodObject<{
    slug: z.ZodString;
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
        sellingPrice: "sellingPrice";
        stock: "stock";
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
export declare const createProductSchema: z.ZodObject<{
    name: z.ZodString;
    productId: z.ZodOptional<z.ZodString>;
    productType: z.ZodDefault<z.ZodEnum<typeof ProductType>>;
    categoryId: z.ZodString;
    categoryName: z.ZodOptional<z.ZodString>;
    color: z.ZodString;
    size: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    sellingPrice: z.ZodCoercedNumber<unknown>;
    buyingPrice: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    discount: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    stock: z.ZodCoercedNumber<unknown>;
    lowStockAlert: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    specifications: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    tags: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodEnum<typeof ProductTag>>>>;
    showOnHomepage: z.ZodDefault<z.ZodOptional<z.ZodCoercedBoolean<unknown>>>;
    image: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const productViewQuerySchema: z.ZodObject<{
    productId: z.ZodString;
    variantId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductQuery = z.infer<typeof createProductSchema>;
export type GetProductQuery = z.infer<typeof productQuerySchema>;
export type GetProductSlugQuery = z.infer<typeof productSlugParamsSchema>;
export type GetProductViewQuery = z.infer<typeof productViewQuerySchema>;
//# sourceMappingURL=product.validation.d.ts.map