import { z } from "zod";
export declare const createSaleSchema: z.ZodObject<{
    customerName: z.ZodString;
    customerPhone: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        variantId: z.ZodString;
        quantity: z.ZodNumber;
        sellingPrice: z.ZodNumber;
        discountType: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
            flat: "flat";
            percentage: "percentage";
        }>>>;
        discountValue: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    paymentMethod: z.ZodEnum<{
        cash: "cash";
        cash_on_delivery: "cash_on_delivery";
        card: "card";
        mobile_banking: "mobile_banking";
        credit: "credit";
    }>;
    paidAmount: z.ZodDefault<z.ZodNumber>;
    note: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const customerQuerySchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    limit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    search: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    is_active: z.ZodPipe<z.ZodOptional<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>, z.ZodTransform<boolean | undefined, "true" | "false" | undefined>>;
    sort_by: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        name: "name";
        createdAt: "createdAt";
        stock: "stock";
        selling_price: "selling_price";
        lastPurchasedAt: "lastPurchasedAt";
    }>>>;
    sort_order: z.ZodDefault<z.ZodPipe<z.ZodOptional<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>, z.ZodTransform<1 | -1, "asc" | "desc" | undefined>>>;
}, z.core.$strip>;
export declare const createCustomerSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodString;
}, z.core.$strip>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type GetCustomerQuery = z.infer<typeof customerQuerySchema>;
//# sourceMappingURL=customer.validation.d.ts.map