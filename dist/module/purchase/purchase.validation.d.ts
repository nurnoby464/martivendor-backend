import { z } from "zod";
import { ProductTag } from "../product/product.interface";
export declare const updatePurchaseSchema: z.ZodObject<{
    paidAmount: z.ZodNumber;
    note: z.ZodOptional<z.ZodString>;
    paymentMethod: z.ZodEnum<{
        cash: "cash";
        online: "online";
    }>;
}, z.core.$strip>;
export declare const updateStockPurchaseSchema: z.ZodObject<{
    variantId: z.ZodString;
    quantity: z.ZodNumber;
    sellingPrice: z.ZodNumber;
    buyingPrice: z.ZodNumber;
    paidAmount: z.ZodNumber;
    purchaseDate: z.ZodOptional<z.ZodString>;
    note: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const purchaseParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const purchaseQuerySchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    limit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    vendorId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        partial: "partial";
        pending: "pending";
        paid: "paid";
    }>>;
    fromDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
    search: z.ZodOptional<z.ZodString>;
    toDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>>;
    sortBy: z.ZodDefault<z.ZodEnum<{
        createdAt: "createdAt";
        purchase_date: "purchase_date";
        total_amount: "total_amount";
        due_amount: "due_amount";
    }>>;
}, z.core.$strip>;
declare const purchaseItemSchema: z.ZodObject<{
    productName: z.ZodUnion<[z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>, z.ZodPipe<z.ZodNull, z.ZodTransform<undefined, null>>]>;
    productId: z.ZodUnion<[z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>, z.ZodPipe<z.ZodNull, z.ZodTransform<undefined, null>>]>;
    categoryId: z.ZodUnion<[z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>, z.ZodPipe<z.ZodNull, z.ZodTransform<undefined, null>>]>;
    categoryName: z.ZodUnion<[z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>, z.ZodPipe<z.ZodNull, z.ZodTransform<undefined, null>>]>;
    color: z.ZodString;
    size: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    buyingPrice: z.ZodNumber;
    sellingPrice: z.ZodNumber;
    quantity: z.ZodNumber;
    images: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    lowStockAlert: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    tags: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodEnum<typeof ProductTag>>>>;
    showOnHomepage: z.ZodDefault<z.ZodOptional<z.ZodCoercedBoolean<unknown>>>;
}, z.core.$strip>;
export declare const createPurchaseSchema: z.ZodObject<{
    purchaseDate: z.ZodOptional<z.ZodString>;
    paidAmount: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    note: z.ZodOptional<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        productName: z.ZodUnion<[z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>, z.ZodPipe<z.ZodNull, z.ZodTransform<undefined, null>>]>;
        productId: z.ZodUnion<[z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>, z.ZodPipe<z.ZodNull, z.ZodTransform<undefined, null>>]>;
        categoryId: z.ZodUnion<[z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>, z.ZodPipe<z.ZodNull, z.ZodTransform<undefined, null>>]>;
        categoryName: z.ZodUnion<[z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>, z.ZodPipe<z.ZodNull, z.ZodTransform<undefined, null>>]>;
        color: z.ZodString;
        size: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        buyingPrice: z.ZodNumber;
        sellingPrice: z.ZodNumber;
        quantity: z.ZodNumber;
        images: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
        lowStockAlert: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
        tags: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodEnum<typeof ProductTag>>>>;
        showOnHomepage: z.ZodDefault<z.ZodOptional<z.ZodCoercedBoolean<unknown>>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>;
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>;
export type ListPurchaseQuery = z.infer<typeof purchaseQuerySchema>;
export type UpdateStockPurchaseInput = z.infer<typeof updateStockPurchaseSchema>;
export {};
//# sourceMappingURL=purchase.validation.d.ts.map