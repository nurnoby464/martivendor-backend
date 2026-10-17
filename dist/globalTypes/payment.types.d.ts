export declare const PAYMENT_STATUSES: readonly ["due", "partial", "paid", "refunded"];
export declare const PAYMENT_RECORD_STATUSES: readonly ["pending", "paid", "failed", "refunded", "partially_refunded"];
export declare const PAYMENT_METHODS: readonly ["cash", "cash_on_delivery", "card", "mobile_banking", "credit", "online"];
export type TPaymentMethod = (typeof PAYMENT_METHODS)[number];
export type TPaymentRecordStatus = (typeof PAYMENT_RECORD_STATUSES)[number];
export type TPaymentStatus = (typeof PAYMENT_STATUSES)[number];
//# sourceMappingURL=payment.types.d.ts.map