import { TSubOrderStatus } from "../CRM/subOrder/subOrder.interface";
export declare const generateOrderNumber: () => Promise<string>;
export declare const generateSubOrderNumber: (orderNumber: string, index: number) => string;
export type TDerivedOrderStatus = "pending" | "processing" | "partially_shipped" | "shipped" | "partially_delivered" | "delivered" | "cancelled" | "returned";
export declare const deriveOrderStatus: (subOrders: ReadonlyArray<{
    status: TSubOrderStatus;
}>) => TDerivedOrderStatus;
//# sourceMappingURL=orderHelper.d.ts.map