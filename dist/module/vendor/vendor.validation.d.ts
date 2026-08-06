import { z } from "zod";
export declare const createVendorSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodString;
    email: z.ZodOptional<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string | null, string>>, z.ZodNullable<z.ZodString>>>;
    address: z.ZodNullable<z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<string | null, string>>>>;
}, z.core.$strip>;
export declare const updateVendorSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string | null, string>>, z.ZodNullable<z.ZodString>>>;
    address: z.ZodNullable<z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<string | null, string>>>>;
    is_active: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const addNoteSchema: z.ZodObject<{
    text: z.ZodString;
}, z.core.$strip>;
export declare const vendorParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const noteParamsSchema: z.ZodObject<{
    id: z.ZodString;
    noteId: z.ZodString;
}, z.core.$strip>;
export declare const vendorQuerySchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    limit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    search: z.ZodOptional<z.ZodString>;
    is_active: z.ZodPipe<z.ZodOptional<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>, z.ZodTransform<boolean, "true" | "false" | undefined>>;
    sort_by: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        name: "name";
        createdAt: "createdAt";
        due: "due";
    }>>>;
    sort_order: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>>;
}, z.core.$strip>;
//# sourceMappingURL=vendor.validation.d.ts.map