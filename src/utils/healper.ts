import { Types } from "mongoose";
import Order from "../CRM/order/order.schema";
interface ICalculateDiscount {
  sellingPrice: number;
  quantity: number;
  discountType: "flat" | "percentage" | null;
  discountValue: number;
}

export const generateOderNumber = async (
  sellerId: Types.ObjectId,
): Promise<string> => {
  const count = await Order.countDocuments({ sellerId });
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const date = String(new Date().getDate()).padStart(2, "0");
  const orderNum = String(count + 1).padStart(5, "0");
  return `ORD-${year}${month}${date}${orderNum}`;
};
export const generateInvoiceNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const date = String(new Date().getDate()).padStart(2, "0");
  const orderNum = String(Math.floor(Math.random() * 100000)).padStart(5, "0");
  return `INV-${year}${month}${date}${orderNum}`;
};

export const calculateDiscount = (data: ICalculateDiscount): number => {
  const { sellingPrice, quantity, discountType, discountValue } = data;

  if (!discountType || !discountValue) return 0;

  if (discountType === "flat") {
    return discountValue * quantity;
  }

  return (sellingPrice * discountValue) / 100 * quantity;
};
