import { z } from "zod";
declare const shippingAddressSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodString;
    address: z.ZodString;
    city: z.ZodString;
    zip: z.ZodDefault<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const createOrderBody: z.ZodObject<{
    phone: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        variantId: z.ZodString;
        quantity: z.ZodNumber;
    }, z.core.$strip>>;
    shippingAddress: z.ZodObject<{
        name: z.ZodString;
        phone: z.ZodString;
        address: z.ZodString;
        city: z.ZodString;
        zip: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>;
    paymentMethod: z.ZodEnum<{
        cash: "cash";
        cash_on_delivery: "cash_on_delivery";
        card: "card";
        mobile_banking: "mobile_banking";
        credit: "credit";
        online: "online";
    }>;
    note: z.ZodDefault<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const updateOrderStatusParam: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const updateOrderStatusBody: z.ZodObject<{
    order_status: z.ZodEnum<{
        pending: "pending";
        cancelled: "cancelled";
        processing: "processing";
        shipped: "shipped";
        delivered: "delivered";
    }>;
}, z.core.$strip>;
export declare const updatePaymentParam: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const updatePaymentBody: z.ZodObject<{
    paid_amount: z.ZodNumber;
    payment_method: z.ZodEnum<{
        cash: "cash";
        card: "card";
        mobile_banking: "mobile_banking";
        online: "online";
    }>;
}, z.core.$strip>;
export declare const getOrderListQuery: z.ZodObject<{
    page: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    limit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    orderStatus: z.ZodOptional<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodEnum<{
        pending: "pending";
        cancelled: "cancelled";
        processing: "processing";
        shipped: "shipped";
        delivered: "delivered";
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
export declare const getMyOrderByIdParamSchema: z.ZodObject<{
    orderId: z.ZodString;
}, z.core.$strip>;
export declare const getMyOrdersQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    status: z.ZodDefault<z.ZodEnum<{
        pending: "pending";
        returned: "returned";
        cancelled: "cancelled";
        processing: "processing";
        shipped: "shipped";
        delivered: "delivered";
        all: "all";
    }>>;
    search: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type TCreateOrderInput = z.infer<typeof createOrderBody>;
export type TUpdateOrderStatusInput = z.infer<typeof updateOrderStatusBody>;
export type TUpdatePaymentInput = z.infer<typeof updatePaymentBody>;
export type TGetOrderListQuery = z.infer<typeof getOrderListQuery>;
export type TShippingAddress = z.infer<typeof shippingAddressSchema>;
export type TMyOrdersQuery = z.infer<typeof getMyOrdersQuerySchema>;
export {};
//# sourceMappingURL=order.validation.d.ts.map