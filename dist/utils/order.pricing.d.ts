import { TDraftSeller, TSubOrderLineDraft } from "../CRM/subOrder/subOrder.interface";
export declare const calculateShipping: (_seller: TDraftSeller) => number;
export declare const calculateSubOrderMoney: (lines: TSubOrderLineDraft[], seller: TDraftSeller) => {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    shippingCharge: number;
    total: number;
    commissionAmount: number;
    commissionRate: number;
    sellerEarning: number;
};
//# sourceMappingURL=order.pricing.d.ts.map