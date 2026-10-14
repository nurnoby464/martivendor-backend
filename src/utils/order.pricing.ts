import {
  TDraftSeller,
  TSubOrderLineDraft,
} from "../CRM/subOrder/subOrder.interface";
import { ISeller } from "../module/seller/seller.interface";
import { round2 } from "./money";
import { SHIPPING_FEE } from "./order.constant";

type TSellerForPricing = Pick<TDraftSeller, "isPlatform" | "commissionRate">;

export const calculateShipping = (_seller: TDraftSeller): number =>
  SHIPPING_FEE;

export const calculateSubOrderMoney = (
  lines: TSubOrderLineDraft[],
  seller: TDraftSeller,
) => {
  const subtotal = round2(
    lines.reduce((sum, curr) => sum + curr.totalPrice, 0),
  );
  const discountAmount = round2(
    lines.reduce((sum, curr) => sum + curr.discountAmount, 0),
  );
  const taxAmount = 0;
  const shippingCharge = calculateShipping(seller);
  const total = round2(subtotal + taxAmount + shippingCharge);

  const commissionRate = seller.isPlatform ? 0 : seller.commissionRate;
  const commissionAmount = round2((subtotal * commissionRate) / 100);
  const sellerEarning = round2(total - commissionAmount);

  return {
    subtotal,
    discountAmount,
    taxAmount,
    shippingCharge,
    total,
    commissionAmount,
    commissionRate,
    sellerEarning,
  };
};
