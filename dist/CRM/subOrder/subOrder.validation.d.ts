import z from "zod";
export declare const sellerOrderListQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    status: z.ZodPipe<z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string[] | undefined, string | undefined>>, z.ZodOptional<z.ZodArray<z.ZodEnum<{
        pending: "pending";
        returned: "returned";
        cancelled: "cancelled";
        processing: "processing";
        shipped: "shipped";
        delivered: "delivered";
    }>>>>;
    payoutStatus: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodEnum<{
        paid: "paid";
        held: "held";
        released: "released";
        reversed: "reversed";
    }>>>;
    search: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    minTotal: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    maxTotal: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    dateFrom: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    dateTo: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    sortBy: z.ZodDefault<z.ZodEnum<{
        createdAt: "createdAt";
        total: "total";
    }>>;
    sortOrder: z.ZodPipe<z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>, z.ZodTransform<1 | -1, "asc" | "desc">>;
}, z.core.$strip>;
export declare const orderIdParamSchema: z.ZodObject<{
    orderId: z.ZodString;
}, z.core.$strip>;
export type TSellerOrderListQuery = z.infer<typeof sellerOrderListQuerySchema>;
//# sourceMappingURL=subOrder.validation.d.ts.map