import { z } from "zod";
export declare const createSaleSchema: z.ZodObject<{
    customerId: z.ZodOptional<z.ZodString>;
    customerEmail: z.ZodOptional<z.ZodString>;
    customerName: z.ZodOptional<z.ZodString>;
    customerPhone: z.ZodOptional<z.ZodString>;
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
        credit: "credit";
        cash: "cash";
        cash_on_delivery: "cash_on_delivery";
        card: "card";
        mobile_banking: "mobile_banking";
    }>;
    paidAmount: z.ZodDefault<z.ZodNumber>;
    note: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    discount: z.ZodString;
}, z.core.$strip>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
//# sourceMappingURL=posSell.validation.d.ts.map