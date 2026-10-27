"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = void 0;
const posSell_schema_1 = __importDefault(require("../posSell/posSell.schema"));
const subOrder_schema_1 = __importDefault(require("../subOrder/subOrder.schema"));
const getStats = async (sellerId) => {
    const [activeOrders, [pos]] = await Promise.all([
        await subOrder_schema_1.default.countDocuments({
            sellerId,
            status: { $nin: ["cancelled", "delivered", "returned"] },
        }),
        posSell_schema_1.default.aggregate([
            {
                $match: {
                    sellerId,
                    status: "completed",
                    paymentStatus: "paid",
                },
            },
            {
                $group: {
                    _id: null,
                    totalPOSIncome: { $sum: "$netAmount" },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalPOSIncome: 1,
                },
            },
        ]),
    ]);
    return {
        totalSales: 20000,
        offlineIncome: pos.totalPOSIncome,
        onlineIncome: 5000,
        activeOrders: activeOrders,
        lowStockAlerts: 30,
    };
};
exports.getStats = getStats;
//# sourceMappingURL=dashboard.service.js.map