export type TPaymentStatus = "due" | "partial" | "paid" | "refunded";

export type TPaymentMethod =
  | "cash"
  | "cash_on_delivery"
  | "card"
  | "mobile_banking"
  | "credit"
  | "online";