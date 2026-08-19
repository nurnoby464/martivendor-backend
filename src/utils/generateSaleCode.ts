import mongoose from "mongoose";
import PosSale from "../CRM/posSell/posSell.schema";

export const generateSaleCode = async (sellerId: mongoose.Types.ObjectId): Promise<string> => {
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, "");
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));

  const endOFDay = new Date(today.setHours(23, 59, 59, 999));
  const count = await PosSale.countDocuments({
    sellerId,
    createdAt: { $gt: startOfDay, $lt: endOFDay },
  });
  const sequence = String(count + 1).padStart(5, "0");
  return `SL-${datePart}-${sequence}`;
};
