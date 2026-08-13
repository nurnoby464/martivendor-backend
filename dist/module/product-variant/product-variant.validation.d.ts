import { z } from "zod";
export declare const createVariantSchema: z.ZodObject<{
    attributes: z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        value: z.ZodString;
    }, z.core.$strip>>;
    buyingPrice: z.ZodNumber;
    sellingPrice: z.ZodNumber;
    stock: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    lowStockAlert: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    image: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export declare const updateVariantSchema: z.ZodObject<{
    buyingPrice: z.ZodOptional<z.ZodNumber>;
    sellingPrice: z.ZodOptional<z.ZodNumber>;
    stock: z.ZodOptional<z.ZodNumber>;
    lowStockAlert: z.ZodOptional<z.ZodNumber>;
    image: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const variantParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const productVariantParamsSchema: z.ZodObject<{
    id: z.ZodString;
    variantId: z.ZodString;
}, z.core.$strip>;
export declare const productVariantQuerySchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    limit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    search: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodPipe<z.ZodOptional<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>, z.ZodTransform<1 | -1, "asc" | "desc" | undefined>>>;
    sortBy: z.ZodDefault<z.ZodEnum<{
        createdAt: "createdAt";
        purchase_date: "purchase_date";
        total_amount: "total_amount";
        due_amount: "due_amount";
    }>>;
    stock: z.ZodOptional<z.ZodEnum<{
        lowStock: "lowStock";
        outOfStock: "outOfStock";
        reminderStock: "reminderStock";
    }>>;
}, z.core.$strip>;
export declare const editProductVariantSchema: z.ZodObject<{
    variantId: z.ZodString;
    sellingPrice: z.ZodNumber;
    newImage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    previousImage: z.ZodString;
    alertStock: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const myInventoryQuerySchema: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodEnum<{
        name: "name";
        createdAt: "createdAt";
        updatedAt: "updatedAt";
        stock: "stock";
        price: "price";
    }>>;
    sortOrder: z.ZodDefault<z.ZodPipe<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>, z.ZodTransform<1 | -1, "asc" | "desc">>>;
    page: z.ZodDefault<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>>;
    limit: z.ZodDefault<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>>;
    categorySlug: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type IMyInventoryQuery = z.infer<typeof myInventoryQuerySchema>;
export type EditProductVariantInput = z.infer<typeof editProductVariantSchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
//# sourceMappingURL=product-variant.validation.d.ts.map