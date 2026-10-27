import { z } from "zod";
export declare const customerQuerySchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    limit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    search: z.ZodOptional<z.ZodString>;
    phone: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodString>>>;
    source: z.ZodOptional<z.ZodEnum<{
        online: "online";
        pos: "pos";
    }>>;
    hasDue: z.ZodOptional<z.ZodPipe<z.ZodEnum<{
        true: "true";
    }>, z.ZodTransform<true | undefined, "true">>>;
    isActive: z.ZodPipe<z.ZodOptional<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>, z.ZodTransform<boolean | undefined, "true" | "false" | undefined>>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        name: "name";
        createdAt: "createdAt";
        sellingPrice: "sellingPrice";
        stock: "stock";
        lastPurchasedAt: "lastPurchasedAt";
    }>>>;
    sortOrder: z.ZodDefault<z.ZodPipe<z.ZodOptional<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>, z.ZodTransform<1 | -1, "asc" | "desc" | undefined>>>;
}, z.core.$strip>;
export declare const createCustomerSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodString>;
}, z.core.$strip>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type GetCustomerQuery = z.infer<typeof customerQuerySchema>;
//# sourceMappingURL=customer.validation.d.ts.map