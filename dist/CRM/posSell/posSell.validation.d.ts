import { z } from "zod";
export declare const posCustomerSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createSaleSchema: z.ZodObject<{
    customerId: z.ZodNullable<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        variantId: z.ZodString;
        quantity: z.ZodNumber;
    }, z.core.$strip>>;
    paymentMethod: z.ZodEnum<{
        cash: "cash";
        cash_on_delivery: "cash_on_delivery";
        card: "card";
        mobile_banking: "mobile_banking";
        credit: "credit";
    }>;
    paidAmount: z.ZodDefault<z.ZodNumber>;
    discountValue: z.ZodDefault<z.ZodNumber>;
    discountType: z.ZodDefault<z.ZodEnum<{
        flat: "flat";
        percentage: "percentage";
    }>>;
    note: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
//# sourceMappingURL=posSell.validation.d.ts.map