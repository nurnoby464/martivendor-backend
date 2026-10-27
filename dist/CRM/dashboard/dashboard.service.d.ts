import { Types } from "mongoose";
export declare const getStats: (sellerId: Types.ObjectId) => Promise<{
    totalSales: number;
    offlineIncome: any;
    onlineIncome: number;
    activeOrders: number;
    lowStockAlerts: number;
}>;
//# sourceMappingURL=dashboard.service.d.ts.map