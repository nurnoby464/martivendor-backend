import mongoose, { Types } from "mongoose";
import { generateSaleCode } from "../../utils/generateSaleCode";
import { CreateSaleInput } from "./posSell.validation";
import { AppError } from "../../middlewares/appError";
import Product from "../../module/product/product.schema";
import ProductVariant from "../../module/product-variant/product-variant.schema";
import PosSale from "./posSell.schema";
import { DiscountType } from "./posSell.interface";
import { IAttribute } from "../../module/product-variant/product-variant.interface";
import SellerCustomer from "../sellerCustomer/sellerCustomer.schema";
import { round2 } from "../../utils/money";
import { calculateDiscount } from "../../utils/helper";

type CalculatedItem = {
  productId: mongoose.Types.ObjectId;
  variantId: mongoose.Types.ObjectId;
  productName: string;
  color: string;
  size: string;
  sku: string;
  quantity: number;
  buyingPrice: number;
  sellingPrice: number;
  discountType: "flat" | "percentage" | null;
  discountValue: number;
  discountAmount: number;
  lineTotal: number;
  attributes: IAttribute[];
};

interface ICreateSalePayload {
  sellerId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId | null;
  input: CreateSaleInput;
  createdByType: "staff" | "system";
}

// ─── Helpers ──────────────────────────────────────────────
const OFFLINE_PAYMENT_METHODS = new Set(["cash", "cash_on_delivery", "credit"]);

const getPOSLevelDiscount = (
  amountAfterItemDiscounts: number,
  discountType: DiscountType,
  discountValue: number,
): number => {
  if (!discountType || !discountValue || discountValue <= 0) return 0;

  const raw = calculateDiscount({
    lineBase: amountAfterItemDiscounts,
    quantity: 1,
    discountType,
    discountValue,
  });
  return Math.min(Math.max(raw, 0), amountAfterItemDiscounts);
};

const getItemPricing = (variant: {
  sellingPrice: number;
  discountValue: number;
  discountType: "flat" | "percentage" | null;
}) => {
  const sellingPrice = variant.sellingPrice;
  const discountValue = Math.min(Math.max(variant.discountValue ?? 0, 0), 100);
  const discountType: DiscountType = variant.discountType;
  return { sellingPrice, discountType, discountValue };
};

const getAttribute = (
  attributes: { key: string; value: string }[],
  key: string,
): string => attributes.find((a) => a.key === key)?.value ?? "";

const resolveCustomer = async (
  sellerId: Types.ObjectId,
  netAmount: number,
  paidApplied: number,
  // effectivePaid: number,
  session: mongoose.ClientSession,
  customerId: string | null,
): Promise<{ _id: Types.ObjectId; name: string; phone: string } | null> => {
  // Walk-in sale — no customer attached, nothing to resolve.
  if (!customerId) return null;
  if (!Types.ObjectId.isValid(customerId)) {
    throw new AppError("Invalid customer id", 400);
  }

  const updated = await SellerCustomer.findOneAndUpdate(
    { sellerId, customerId: new Types.ObjectId(customerId), isActive: true },
    {
      $inc: {
        totalPurchased: netAmount,
        totalPaid: paidApplied,
        due: round2(netAmount - paidApplied),
      },
      $set: {
        lastPurchasedAt: new Date(),
      },
    },
    { session, returnDocument: "after", updatePipeline: true },
  );

  if (!updated) throw new AppError("Customer not found", 404);

  return { _id: updated._id, name: updated.name, phone: updated.phone };
};

export const createSale = async (payload: ICreateSalePayload) => {
  const { sellerId, createdBy, input, createdByType } = payload;
  const {
    customerId: inputCustomerId,
    items,
    paymentMethod,
    paidAmount,
    note,
    discountType: posDiscountType,
    discountValue: posDiscountValue,
  } = input;

  // 1. block online payments — this endpoint is offline-only
  if (!OFFLINE_PAYMENT_METHODS.has(paymentMethod)) {
    throw new AppError(
      "Online payments must use /orders/initiate endpoint",
      400,
    );
  }

  if (paidAmount < 0) {
    throw new AppError("Paid amount cannot be negative", 400);
  }

  const sellerObjectId = new Types.ObjectId(sellerId);

  // Reject duplicate line items up front — same variant twice means the
  // client should have merged quantities, and it also breaks our
  // "one map entry per id" assumption below.
  const variantIdCounts = new Map<string, number>();

  for (const item of items) {
    variantIdCounts.set(
      item.variantId,
      (variantIdCounts.get(item.variantId) ?? 0) + 1,
    );
  }

  const duplicateVariant = [...variantIdCounts.entries()].find(
    ([, count]) => count > 1,
  );
  if (duplicateVariant) {
    throw new AppError(
      `Duplicate item in cart for variant ${duplicateVariant[0]}`,
      400,
    );
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 2. load all products in one query
    const productIds = [...new Set(items.map((i) => i.productId))].map(
      (id) => new Types.ObjectId(id),
    );

    const products = await Product.find({
      _id: { $in: productIds },
      sellerId: sellerObjectId,
      isActive: true,
    })
      .select("_id name")
      .session(session);

    if (products.length !== productIds.length) {
      throw new AppError("One or more products not found", 404);
    }

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    // 3. load all variants in one query
    const variantIds = items.map((i) => new Types.ObjectId(i.variantId));

    const variants = await ProductVariant.find({
      _id: { $in: variantIds },
      sellerId: sellerObjectId,
      isActive: true,
    })
      .select(
        "attributes discountType  discountValue isActive sellingPrice productId sku buyingPrice",
      )
      .session(session);

    if (variants.length !== items.length) {
      throw new AppError("One or more variants not found", 404);
    }
    const variantMap = new Map(variants.map((v) => [v._id.toString(), v]));

    // 4. validate stock + build calculated items (server-priced, not client-priced)
    const calculatedItems: CalculatedItem[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      const variant = variantMap.get(item.variantId);

      if (!product)
        throw new AppError(`Product not found: ${item.productId}`, 404);
      if (!variant)
        throw new AppError(`Variant not found: ${item.variantId}`, 404);

      if (variant.productId.toString() !== item.productId) {
        throw new AppError(
          `Variant ${item.variantId} does not belong to product ${item.productId}`,
          400,
        );
      }

      if (item.quantity <= 0) {
        throw new AppError(
          `Invalid quantity for ${product.name} - ${variant.sku}`,
          400,
        );
      }

      if (variant.stock < item.quantity) {
        throw new AppError(
          `Insufficient stock for ${product.name} - ${variant.sku}. Available: ${variant.stock}`,
          400,
        );
      }

      const color = getAttribute(variant.attributes, "color");

      const size = getAttribute(variant.attributes, "size");

      // ── SECURITY: sellingPrice + discount are always server-derived.
      const { sellingPrice, discountType, discountValue } =
        getItemPricing(variant);

      const discountAmount = calculateDiscount({
        lineBase: round2(sellingPrice * item.quantity),
        quantity: item.quantity,
        discountType,
        discountValue,
      });

      const lineTotal = sellingPrice * item.quantity - discountAmount;

      calculatedItems.push({
        productId: new Types.ObjectId(item.productId),
        variantId: new Types.ObjectId(item.variantId),
        productName: product.name,
        color,
        size,
        sku: variant.sku,
        attributes: variant.attributes ?? [],
        quantity: item.quantity,
        buyingPrice: variant.buyingPrice, // actual cost, for margin reporting
        sellingPrice,
        discountType,
        discountValue,
        discountAmount,
        lineTotal,
      });
    }

    // 5. calculate totals
    const grossAmount = round2(
      calculatedItems.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0),
    );
    const itemDiscountTotal = round2(
      calculatedItems.reduce((sum, i) => sum + i.discountAmount, 0),
    );

    const amountAfterItemDiscounts = round2(grossAmount - itemDiscountTotal);
    // Order-level discount: manually entered by the cashier at checkout,
    // applied once on top of item discounts, clamped so it can't go negative.
    const posDiscountAmount = round2(
      getPOSLevelDiscount(
        amountAfterItemDiscounts,
        posDiscountType ?? null,
        posDiscountValue ?? 0,
      ),
    );

    const discountTotal = round2(itemDiscountTotal + posDiscountAmount);
    const netAmount = round2(Math.max(grossAmount - discountTotal, 0));

    // 6. calculate payment status
    // cash_on_delivery: nothing collected yet at sale time.
    // credit: sale is fully on account, nothing collected now either.
    const effectivePaid =
      paymentMethod === "cash_on_delivery" || paymentMethod === "credit"
        ? 0
        : Math.min(paidAmount, netAmount === 0 ? paidAmount : Infinity);
    const dueAmount = Math.max(netAmount - effectivePaid, 0);
    const changeAmount = Math.max(effectivePaid - netAmount, 0);
    const paidApplied = round2(Math.min(effectivePaid, netAmount));

    const paymentStatus =
      effectivePaid <= 0
        ? "due"
        : effectivePaid >= netAmount
          ? "paid"
          : "partial";
    // 7. resolve or create customer
    const resolvedCustomer = await resolveCustomer(
      sellerObjectId,
      netAmount,
      paidApplied,
      session,
      inputCustomerId,
    );

    // 8. deduct stock atomically — guard against a race between the read in
    // step 3 and this write by requiring stock to still be sufficient.
    for (const item of calculatedItems) {
      const result = await ProductVariant.updateOne(
        {
          _id: item.variantId,
          sellerId: sellerObjectId,
          stock: { $gte: item.quantity },
        },
        { $inc: { stock: -item.quantity } },
        { session },
      );

      if (result.matchedCount === 0) {
        throw new AppError(
          `Stock changed for ${item.productName} (${item.sku}) — please refresh and try again`,
          409,
        );
      }
    }

    // 9. generate sale code
    const saleCode = await generateSaleCode(sellerId);

    // 10. create sale
    const [sale] = await PosSale.create(
      [
        {
          sellerId: sellerObjectId,
          saleCode,
          ...(resolvedCustomer && {
            customer: {
              name: resolvedCustomer.name,
              phone: resolvedCustomer.phone,
              customerId: resolvedCustomer._id,
            },
          }),
          items: calculatedItems,
          grossAmount,
          discountTotal,
          posDiscountType,
          posDiscountValue,
          posDiscountAmount,
          netAmount,
          paidAmount: effectivePaid,
          dueAmount,
          changeAmount,
          paymentMethod,
          paymentStatus,
          creditUsed: 0,
          saleDate: new Date(),
          note: note ?? null,
          status: "completed",
          createdBy,
          createdByType,
        },
      ],
      { session },
    );

    if (!sale) throw new AppError("Sale not created", 400);

    await session.commitTransaction();
    return sale;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
