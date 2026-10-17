export type TConfirmationData = {
    orderNumber: string;
    createdAt: Date;
    shippingAddress: {
        name: string;
        phone: string;
        address: string;
        city: string;
        zip: string | null;
    };
    paymentMethod: string | null;
    paymentStatus: string;
    subtotal: number;
    discountTotal: number;
    shippingTotal: number;
    grandTotal: number;
    dueAmount: number;
    packages: {
        subOrderNumber: string;
        sellerName: string;
        items: {
            name: string;
            quantity: number;
            sellingPrice: number;
            totalPrice: number;
        }[];
        shippingCharge: number;
        total: number;
    }[];
};
export declare const orderConfirmationTemplate: (customerName: string, o: TConfirmationData) => string;
//# sourceMappingURL=orderConfirmation.d.ts.map