import { TSubOrderStatus } from "../CRM/subOrder/subOrder.interface";
import { nextSequence } from "./counter";

export const generateOrderNumber = async (): Promise<string> => {
  const day = new Date()
    .toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" }) // 2026-10-07
    .replace(/-/g, "");
  const seq = await nextSequence(`order:${day}`);
  return `ORD-${day}-${String(seq).padStart(5, "0")}`;
};

// ORD-20261007-00001-1, -2, -3 ...
export const generateSubOrderNumber = (
  orderNumber: string,
  index: number, // 1-based
): string => `${orderNumber}-${index}`;

export type TDerivedOrderStatus =
  | "pending"
  | "processing"
  | "partially_shipped"
  | "shipped"
  | "partially_delivered"
  | "delivered"
  | "cancelled"
  | "returned";


  export const deriveOrderStatus = (
  subOrders: ReadonlyArray<{ status: TSubOrderStatus }>,
): TDerivedOrderStatus => {
  const active = subOrders.filter((s) => s.status !== "cancelled");
  if (active.length === 0) return "cancelled";
 
  const all = (st: TSubOrderStatus) => active.every((s) => s.status === st);
  const some = (st: TSubOrderStatus) => active.some((s) => s.status === st);
 
  if (all("returned")) return "returned";
  if (all("delivered")) return "delivered";
  if (all("shipped")) return "shipped";
  if (all("pending")) return "pending";
  if (some("delivered")) return "partially_delivered";
  if (some("shipped")) return "partially_shipped";
  return "processing";
};