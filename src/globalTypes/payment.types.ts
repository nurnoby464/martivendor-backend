export const PAYMENT_STATUSES = ["due", "partial", "paid", "refunded"] as const;
export const PAYMENT_RECORD_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
] as const;

export const PAYMENT_METHODS = [
  "cash",
  "cash_on_delivery",
  "card",
  "mobile_banking",
  "credit",
  "online",
] as const;

export type TPaymentMethod = (typeof PAYMENT_METHODS)[number];
export type TPaymentRecordStatus = (typeof PAYMENT_RECORD_STATUSES)[number];
export type TPaymentStatus = (typeof PAYMENT_STATUSES)[number];


