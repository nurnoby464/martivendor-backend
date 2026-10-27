import { Types } from "mongoose";
import PosSale from "../posSell/posSell.schema";
import SubOrder from "../subOrder/subOrder.schema";

export const getStats = async (sellerId: Types.ObjectId) => {
  const [activeOrders, [pos]] = await Promise.all([
    await SubOrder.countDocuments({
      sellerId,
      status: { $nin: ["cancelled", "delivered", "returned"] },
    }),
    PosSale.aggregate([
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
