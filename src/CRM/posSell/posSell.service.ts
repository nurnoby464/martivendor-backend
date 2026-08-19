import mongoose, { Types } from "mongoose";
import { generateSaleCode } from "../../utils/generateSaleCode";
import { CreateSaleInput } from "./posSell.validation";
import { AppError } from "../../middlewares/appError";
import Product from "../../module/product/product.schema";
import ProductVariant from "../../module/product-variant/product-variant.schema";
import Sale from "./posSell.schema";
import Customer from "../customer/customer.schema";
import { calculateDiscount } from "../../utils/healper";
import PosSale from "./posSell.schema";

type CalculatedItem = {
  productId: mongoose.Types.ObjectId;
  variantId: mongoose.Types.ObjectId;
  productName: string;
  color: string;
  size: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  sellingPrice: number;
  discountType: "flat" | "percentage" | null;
  discountValue: number;
  discountAmount: number;
  subtotal: number;
};

interface ICreateSalePayload {
  sellerId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId | null;
  input: CreateSaleInput;
  createdByType: "staff" | "system";
}

// ─── Helpers ──────────────────────────────────────────────

const getAttribute = (
  attributes: { key: string; value: string }[],
  key: string,
): string => attributes.find((a) => a.key === key)?.value ?? "";

const resolveCustomer = async (
  sellerId: Types.ObjectId,
  netAmount: number,
  effectivePaid: number,
  session: mongoose.ClientSession,
  customerName?: string,
  customerPhone?: string,
): Promise<Types.ObjectId | null> => {
  let existing = await Customer.findOne({
    sellerId,
    phone: "customerPhone",
  }).session(session);

  

  if (existing) {
    await Customer.updateOne({ _id: existing._id }, [
      {
        $set: {
          totalPurchased: { $add: ["$totalPurchased", netAmount] },
          totalPaid: { $add: ["$totalPaid", effectivePaid] },
          due: {
            $max: [
              0,
              {
                $subtract: [
                  { $add: ["$totalPurchased", netAmount] },
                  { $add: ["$totalPaid", effectivePaid] },
                ],
              },
            ],
          },
          credit: {
            $max: [
              0,
              {
                $subtract: [
                  { $add: ["$totalPaid", effectivePaid] },
                  { $add: ["$totalPurchased", netAmount] },
                ],
              },
            ],
          },
          name: customerName,
          lastPurchasedAt: new Date(),
        },
      },
    ]).session(session);
    return existing._id;
  }
  const totalPurchased = netAmount;
  const totalPaid = effectivePaid;
  const due = Math.max(totalPurchased - totalPaid, 0);
  const credit = Math.max(totalPaid - totalPurchased, 0);
  if (!customerPhone || !customerName) {
    return null;
  }
  const [customer] = await Customer.create(
    [
      {
        sellerId,
        name: customerName,
        phone: customerPhone,
        totalPurchased,
        totalPaid,
        due,
        credit,
        lastPurchasedAt: new Date(),
      },
    ],
    { session },
  );
  if (!customer) throw new AppError("Customer not created", 400);
  return customer._id;
};

// ─── Main Service ─────────────────────────────────────────

export const createSale = async (payload: ICreateSalePayload) => {
  const { sellerId, createdBy, input, createdByType } = payload;
  const {
    customerName,
    customerPhone,
    customerEmail,
    customerId: customer_id,
    customer,
    items,
    paymentMethod,
    paidAmount,
    note,
  } = input;
console.log(input)
  // 1. block online payments
  if (paymentMethod === "card" || paymentMethod === "mobile_banking") {
    throw new AppError(
      "Online payments must use /orders/initiate endpoint",
      400,
    );
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const sellerObjectId = new Types.ObjectId(sellerId);

    // 2. load all products in one query
    const productIds = items.map((i) => new Types.ObjectId(i.productId));

    const products = await Product.find({
      _id: { $in: productIds },
      sellerId: sellerObjectId,
      isActive: true,
    }).session(session);

    // check all products found
    const uniqueProductIds = new Set(items.map((i) => i.productId));
    if (products.length !== uniqueProductIds.size) {
      throw new AppError("One or more products not found", 404);
    }

    // build product map → productId: product
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    // 3. load all variants in one query
    const variantIds = items.map((i) => new Types.ObjectId(i.variantId));

    const variants = await ProductVariant.find({
      _id: { $in: variantIds },
      sellerId: sellerObjectId,
      isActive: true,
    }).session(session);

    if (variants.length !== items.length) {
      throw new AppError("One or more variants not found", 404);
    }

    // build variant map → variantId: variant
    const variantMap = new Map(variants.map((v) => [v._id.toString(), v]));

    // 4. validate stock + build calculated items
    const calculatedItems: CalculatedItem[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      const variant = variantMap.get(item.variantId);

      if (!product)
        throw new AppError(`Product not found: ${item.productId}`, 404);
      if (!variant)
        throw new AppError(`Variant not found: ${item.variantId}`, 404);

      // check variant belongs to this product
      if (variant.productId.toString() !== item.productId) {
        throw new AppError(
          `Variant ${item.variantId} does not belong to product ${item.productId}`,
          400,
        );
      }

      // check stock
      if (variant.stock < item.quantity) {
        throw new AppError(
          `Insufficient stock for ${product.name} - ${variant.sku}. Available: ${variant.stock}`,
          400,
        );
      }

      // extract color and size from attributes
      const color = getAttribute(variant.attributes, "color");
      const size = getAttribute(variant.attributes, "size");

      // calculate discount
      const discountAmount = calculateDiscount({
        sellingPrice: item.sellingPrice,
        quantity: item.quantity,
        discountType: item.discountType ?? null,
        discountValue: item.discountValue,
      });

      const subtotal = item.sellingPrice * item.quantity - discountAmount;

      calculatedItems.push({
        productId: new Types.ObjectId(item.productId),
        variantId: new Types.ObjectId(item.variantId),
        productName: product.name,
        color,
        size,
        sku: variant.sku,
        quantity: item.quantity,
        unitPrice: variant.buyingPrice, // from variant — actual cost
        sellingPrice: item.sellingPrice,
        discountType: item.discountType ?? null,
        discountValue: item.discountValue,
        discountAmount,
        subtotal,
      });
    }

    // 5. calculate totals
    const grossAmount = calculatedItems.reduce(
      (sum, i) => sum + i.sellingPrice * i.quantity,
      0,
    );
    const discountTotal = calculatedItems.reduce(
      (sum, i) => sum + i.discountAmount,
      0,
    );
    const netAmount = grossAmount - discountTotal;

    // 6. calculate payment status
    const effectivePaid = paymentMethod === "cash_on_delivery" ? 0 : paidAmount;
    const dueAmount = Math.max(netAmount - effectivePaid, 0);
    const changeAmount = Math.max(effectivePaid - netAmount, 0);
    const paymentStatus =
      effectivePaid <= 0
        ? "due"
        : effectivePaid >= netAmount
          ? "paid"
          : "partial";

    // 7. resolve or create customer
    const customerId = await resolveCustomer(
      sellerObjectId,
      netAmount,
      effectivePaid,
      session,
      customer?.name,
      customer?.phone,
    );

    // 8. deduct stock for each variant
    for (const item of calculatedItems) {
      await ProductVariant.updateOne(
        {
          _id: item.variantId,
          sellerId: sellerObjectId,
        },
        { $inc: { stock: -item.quantity } },
        { session },
      );
    }

    // 9. generate sale code
    const saleCode = await generateSaleCode(sellerId);

    // 10. create sale
    const [sale] = await PosSale.create(
      [
        {
          sellerId: sellerObjectId,
          saleCode,
          ...(customerName &&
            customerPhone && {
              customer: {
                name: customerName,
                phone: customerPhone,
                customerId, // CRM link comes later
              },
            }),
          items: calculatedItems,
          grossAmount,
          discountTotal,
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
          createdBy: createdBy,
          createdByType,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    return sale;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
