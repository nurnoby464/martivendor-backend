import { z } from "zod";
declare const shippingAddressSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodString;
    address: z.ZodString;
    city: z.ZodString;
    zip: z.ZodDefault<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const createOrderBody: z.ZodObject<{
    userId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sellerId: z.ZodString;
    phone: z.ZodString;
    name: z.ZodString;
    email: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    items: z.ZodArray<z.ZodObject<{
        variant_id: z.ZodString;
        quantity: z.ZodNumber;
    }, z.core.$strip>>;
    shipping_address: z.ZodObject<{
        name: z.ZodString;
        phone: z.ZodString;
        address: z.ZodString;
        city: z.ZodString;
        zip: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>;
    discount_amount: z.ZodDefault<z.ZodNumber>;
    tax_amount: z.ZodDefault<z.ZodNumber>;
    shipping_charge: z.ZodDefault<z.ZodNumber>;
    paid_amount: z.ZodDefault<z.ZodNumber>;
    payment_method: z.ZodDefault<z.ZodNullable<z.ZodEnum<{
        credit: "credit";
        cash: "cash";
        online: "online";
        cash_on_delivery: "cash_on_delivery";
        card: "card";
        mobile_banking: "mobile_banking";
    }>>>;
    note: z.ZodDefault<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const updateOrderStatusParam: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const updateOrderStatusBody: z.ZodObject<{
    order_status: z.ZodEnum<{
        pending: "pending";
        processing: "processing";
        shipped: "shipped";
        delivered: "delivered";
        cancelled: "cancelled";
    }>;
}, z.core.$strip>;
export declare const updatePaymentParam: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const updatePaymentBody: z.ZodObject<{
    paid_amount: z.ZodNumber;
    payment_method: z.ZodEnum<{
        cash: "cash";
        online: "online";
        card: "card";
        mobile_banking: "mobile_banking";
    }>;
}, z.core.$strip>;
export declare const getOrderListQuery: z.ZodObject<{
    page: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    limit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    orderStatus: z.ZodOptional<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodEnum<{
        pending: "pending";
        processing: "processing";
        shipped: "shipped";
        delivered: "delivered";
        cancelled: "cancelled";
    }>>>;
    paymentStatus: z.ZodOptional<z.ZodEnum<{
        partial: "partial";
        paid: "paid";
        unpaid: "unpaid";
    }>>;
    customerId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodEnum<{
        name: "name";
        createdAt: "createdAt";
        stock: "stock";
    }>>;
    sortOrder: z.ZodPipe<z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        dsc: "dsc";
    }>>, z.ZodTransform<1 | -1, "asc" | "dsc">>;
}, z.core.$strip>;
export declare const getOrderByIdParam: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const getMyOrdersQuerySchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>, z.ZodNumber>;
    limit: z.ZodPipe<z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>, z.ZodNumber>;
    order_status: z.ZodOptional<z.ZodEnum<{
        pending: "pending";
        all: "all";
        processing: "processing";
        shipped: "shipped";
        delivered: "delivered";
        cancelled: "cancelled";
    }>>;
    search: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const getMyOrderByIdParamSchema: z.ZodObject<{
    orderId: z.ZodString;
}, z.core.$strip>;
export type TCreateOrderInput = z.infer<typeof createOrderBody>;
export type TUpdateOrderStatusInput = z.infer<typeof updateOrderStatusBody>;
export type TUpdatePaymentInput = z.infer<typeof updatePaymentBody>;
export type TGetOrderListQuery = z.infer<typeof getOrderListQuery>;
export type TShippingAddress = z.infer<typeof shippingAddressSchema>;
export {};
//# sourceMappingURL=order.validation.d.ts.map