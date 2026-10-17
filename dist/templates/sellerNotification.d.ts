export type TSellerNotificationData = {
    subOrderNumber: string;
    customerName: string;
    customerPhone: string;
    items: {
        name: string;
        sku: string;
        quantity: number;
        totalPrice: number;
    }[];
    subtotal: number;
    shippingCharge: number;
    total: number;
    paymentNote: string;
};
export declare const sellerNotificationTemplate: (sellerName: string, d: TSellerNotificationData) => string;
//# sourceMappingURL=sellerNotification.d.ts.map