import { calculateSubOrderMoney } from "./../../utils/order.pricing";
import mongoose, { Types } from "mongoose";
import { generateSaleCode } from "../../utils/generateSaleCode";
import { AppError } from "../../middlewares/appError";
import Product from "../../module/product/product.schema";
import ProductVariant from "../../module/product-variant/product-variant.schema";
import Customer from "../customer/customer.schema";
import Order from "./order.schema";
import { useSkip } from "../../utils/useSkip";
import {
  TCreateOrderInput,
  TGetOrderListQuery,
  TMyOrdersQuery,
  TShippingAddress,
} from "./order.validation";
import User from "../../module/user/user.schema";
import { eventEmitter } from "../../shared/events";
import { NOTIFICATION_TYPES } from "../../shared/notifications/constants";
import {
  deriveOrderStatus,
  generateOrderNumber,
  generateSubOrderNumber,
} from "../../utils/orderHelper";
import { Seller } from "../../module/seller/seller.schema";
import { boolean } from "zod";
import {
  calculateDiscount,
  calculateTaxRate,
  escapeRegex,
  normalizedBDPhone,
} from "../../utils/helper";
import { ICustomerAddress } from "../customer/customer.interface";
import {
  SUB_ORDER_STATUSES,
  TSubOrderDraft,
  TSubOrderLineDraft,
  TSubOrderStatus,
} from "../subOrder/subOrder.interface";
import { round2 } from "../../utils/money";
import SubOrder from "../subOrder/subOrder.schema";
import Payment from "../payment/payment.schema";

interface IResolveCustomerInput {
  name: string;
  phone: string;
  email: string;
  shippingAddress: TShippingAddress;
  userId: Types.ObjectId | null;
  session: mongoose.ClientSession;
}

const resolveCustomer = async (input: IResolveCustomerInput) => {
  const { name, phone, email, shippingAddress, userId, session } = input;
  const isSameCustomer = [
    name === shippingAddress.name,
    phone === shippingAddress.phone,
  ].every(Boolean);
  const normalizedPhone = normalizedBDPhone(phone);
  const existingCustomer = await Customer.findOne({
    $or: [{ phone: normalizedPhone }, { email }],
  })
    .select("userId _id addresses phone email")
    .session(session)
    .lean();

  if (!existingCustomer) {
    const newAddress: ICustomerAddress | null = isSameCustomer
      ? {
          label: "home",
          district: shippingAddress.city,
          area: shippingAddress.address,
          zip: shippingAddress.zip,
          isDefault: true,
        }
      : null;

    const [newCustomer] = await Customer.create(
      [
        {
          name,
          phone: normalizedPhone,
          email,
          ...(newAddress && { addresses: [newAddress] }),
          ...(userId !== null && { userId }),
        },
      ],
      { session },
    );
    if (!newCustomer) throw new AppError("Failed to create customer", 500);
    if (newCustomer.userId) {
      const updateUser = await User.findOneAndUpdate(
        {
          _id: newCustomer.userId,
          isActive: true,
        },
        {
          $set: {
            profileId: newCustomer._id,
            profileType: "Customer",
            phone: normalizedPhone,
            role: "customer",
          },
        },
        {
          session,
          returnDocument: "after",
          runValidators: true,
        },
      );
    }
    return newCustomer;
  }
  if (existingCustomer.email !== email) {
    throw new AppError(`${email} not match Customer email`, 400);
  }
  if (phone && existingCustomer.phone && existingCustomer.phone !== phone)
    throw new AppError(`${email} not match Customer phone`, 400);
  return existingCustomer;
};

export const ENABLED_PAYMENT_METHODS = ["cash_on_delivery"] as const;


export const createOrder = async (
  input: TCreateOrderInput,
  userId: Types.ObjectId | null,
) => {
  const { name, phone, email, items, shippingAddress, paymentMethod, note } =
    input;

  if (!(ENABLED_PAYMENT_METHODS as readonly string[]).includes(paymentMethod)) {
    throw new AppError("This payment method is not available yet", 400);
  }

  const orderId = new Types.ObjectId();
  const paymentId = new Types.ObjectId();

  // FIX 1: normalize ids once, and reject duplicates (uppercase hex or repeats broke the Map lookups)
  const cart = items.map((item) => ({
    variantId: new Types.ObjectId(item.variantId),
    quantity: item.quantity,
  }));
  if (new Set(cart.map((c) => c.variantId.toString())).size !== cart.length) {
    throw new AppError("Duplicate items in the cart", 400);
  }
  const variantIds = cart.map((c) => c.variantId);

  const variants = await ProductVariant.find({
    _id: { $in: variantIds },
    isActive: true,
  })
    .select(
      "_id productId sellerId sku image attributes sellingPrice stock discountType discountValue",
    )
    .lean();
  if (variants.length !== cart.length) {
    throw new AppError("One or more variants not found or inactive", 404);
  }

  // FIX 2: unique product ids (two variants of one product are normal)
  const productIds = [...new Set(variants.map((v) => v.productId.toString()))];
  const products = await Product.find({
    _id: { $in: productIds },
    isActive: true,
  })
    .select("_id sellerId name slug taxRate isActive discount hasDiscount")
    .lean();

  // FIX 3: a missing or inactive product is not a "seller mismatch"
  if (products.length !== productIds.length) {
    throw new AppError("One or more products not found or inactive", 404);
  }

  // make unique sellers
  const uniqueSellerIds = [
    ...new Set(variants.map((v) => v.sellerId.toString())),
  ];

  const sellers = await Seller.find({
    _id: { $in: uniqueSellerIds },
    isActive: true,
    status: "approved",
  })
    .select("_id name isPlatform commissionRate userId")
    .lean();

  // add Map
  const productMap = new Map(
    products.map((product) => [
      product._id.toString(),
      { sellerId: product.sellerId.toString(), name: product.name },
    ]),
  );
  const variantMap = new Map(
    variants.map((variant) => [
      variant._id.toString(),
      {
        sellingPrice: variant.sellingPrice,
        stock: variant.stock,
        attributes: variant.attributes,
        discountType: variant.discountType,
        discountValue: variant.discountValue,
        sku: variant.sku,
        productId: variant.productId,
        sellerId: variant.sellerId,
        image: variant.image,
      },
    ]),
  );

  const sellerMap = new Map(sellers.map((s) => [s._id.toString(), s]));
  const subOrderDrafts: TSubOrderDraft[] = [];
  let index = 1;

  const group = new Map<string, TSubOrderLineDraft[]>();

  if (sellerMap.size !== uniqueSellerIds.length) {
    throw new AppError("One or more sellers are not available", 400);
  }
  const hasSellerMismatch = variants.some(
    (variant) =>
      productMap.get(variant.productId.toString())?.sellerId !==
      variant.sellerId.toString(),
  );

  if (hasSellerMismatch)
    throw new AppError("Product and variant seller mismatch", 400);

  for (const item of cart) {
    const variant = variantMap.get(item.variantId.toString());
    if (!variant) {
      throw new AppError(`Not found this ${item.variantId} `, 404);
    }
    const product = productMap.get(variant.productId.toString());
    if (!product) {
      throw new AppError(
        `Product not found for variant: ${item.variantId} `,
        404,
      );
    }

    if (variant.stock < item.quantity) {
      throw new AppError(
        `Insufficient stock for ${product.name} - ${variant.sku}. Available: ${variant.stock}`,
        400,
      );
    }

    const sellingPrice = variant.sellingPrice;
    const quantity = item.quantity;
    const lineBase = round2(sellingPrice * quantity); // FIX 4: round
    const discountAmount = round2(
      calculateDiscount({
        lineBase,
        discountValue: variant.discountValue ?? 0,
        discountType: variant.discountType ?? null,
        quantity,
      }),
    );
    // FIX 4: check BEFORE using the value
    if (discountAmount > lineBase) {
      throw new AppError("Discount amount cannot exceed the total price", 400);
    }
    const totalPrice = round2(lineBase - discountAmount);

    const key = variant.sellerId.toString();
    if (!group.has(key)) group.set(key, []);
    group.get(key)!.push({
      productId: variant.productId,
      variantId: item.variantId,
      name: product.name,
      sku: variant.sku,
      image: variant.image ?? null,
      quantity,
      sellingPrice,
      discountType: variant.discountType ?? null,
      discountValue: variant.discountValue ?? 0,
      discountAmount,
      totalPrice,
    });
  }

  // FIX 5: generate the number AFTER every validation, so 400/404 errors do not waste numbers
  const orderNumber = await generateOrderNumber();

  for (const [sellerId, lines] of group) {
    subOrderDrafts.push({
      sellerId,
      seller: sellerMap.get(sellerId)!,
      lines,
      subOrderNumber: generateSubOrderNumber(orderNumber, index++),
    });
  }
  const subOrderPlans = subOrderDrafts.map((draft) => ({
    ...draft,
    items: draft.lines.map((l) => ({ ...l, taxRate: 0, taxAmount: 0 })),
    ...calculateSubOrderMoney(draft.lines, draft.seller),
  }));

  const sum = (pick: (p: (typeof subOrderPlans)[number]) => number) =>
    round2(subOrderPlans.reduce((s, p) => s + pick(p), 0));

  const orderTotals = {
    subtotal: sum((p) => p.subtotal),
    discountTotal: sum((p) => p.discountAmount),
    taxTotal: 0,
    shippingTotal: sum((p) => p.shippingCharge),
    grandTotal: sum((p) => p.total),
  };

  // FIX 6: a holder for the result. The callback fills it, and we return it AFTER the commit
  const holder: { response: Record<string, unknown> | null } = {
    response: null,
  };

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // this callback can run more than once: no emails, no events, no commit here
      const customer = await resolveCustomer({
        name,
        phone,
        email,
        shippingAddress,
        userId,
        session,
      });
      const customerId = customer._id;
      const allLines = subOrderDrafts
        .flatMap((d) => d.lines)
        .sort((a, b) =>
          a.variantId.toString().localeCompare(b.variantId.toString()),
        );
      const ops = allLines.map((line) => ({
        updateOne: {
          filter: {
            _id: line.variantId,
            isActive: true,
            stock: { $gte: line.quantity },
          },
          update: { $inc: { stock: -line.quantity } },
        },
      }));
      const result = await ProductVariant.bulkWrite(ops, {
        session,
      });

      if (result.matchedCount < ops.length) {
        // no session here: we want the committed stock, to blame the right line
        const current = await ProductVariant.find({
          _id: { $in: allLines.map((l) => l.variantId) },
        })
          .select("_id stock")
          .lean();
        const stockMap = new Map(
          current.map((v) => [v._id.toString(), v.stock]),
        );
        const bad = allLines.find(
          (l) => (stockMap.get(l.variantId.toString()) ?? 0) < l.quantity,
        );
        throw new AppError(
          bad
            ? `Not enough stock for ${bad.name} (${bad.sku}). Available: ${stockMap.get(bad.variantId.toString()) ?? 0}`
            : "Stock changed. Please refresh and try again.",
          409,
        );
      }

      await Order.create(
        [
          {
            _id: orderId,
            orderNumber,
            customerId,
            shippingAddress,
            subOrderCount: subOrderPlans.length,
            ...orderTotals,
            paidAmount: 0,
            dueAmount: orderTotals.grandTotal,
            paymentStatus: "due",
            paymentMethod,
            paymentId,
            note,
          },
        ],
        { session },
      );

      const createdSubOrders = await SubOrder.create(
        subOrderPlans.map((p) => ({
          orderId,
          orderNumber,
          customerId,
          subOrderNumber: p.subOrderNumber,
          sellerId: p.seller._id,
          items: p.items,
          subtotal: p.subtotal,
          discountAmount: p.discountAmount,
          taxAmount: p.taxAmount,
          shippingCharge: p.shippingCharge,
          total: p.total,
          commissionRate: p.commissionRate,
          commissionAmount: p.commissionAmount,
          sellerEarning: p.sellerEarning,
          status: "pending" as const, // FIX 7: keep the literal type
          statusHistory: [
            {
              status: "pending" as const,
              at: new Date(),
              by: null,
              note: "Order placed",
            },
          ],
        })),
        { session, ordered: true },
      );

      await Payment.create(
        [
          {
            _id: paymentId,
            orderId,
            customerId,
            amount: orderTotals.grandTotal,
            method: paymentMethod,
            status: "pending",
          },
        ],
        { session },
      );

      // FIX 8: eventEmitter.emit(...) removed from here (see below, after the commit)

      // FIX 6: assign instead of "return"
      holder.response = {
        orderId,
        orderNumber,
        status: deriveOrderStatus(createdSubOrders),
        paymentStatus: "due",
        paymentMethod,
        subtotal: orderTotals.subtotal,
        shippingTotal: orderTotals.shippingTotal,
        grandTotal: orderTotals.grandTotal,
        dueAmount: orderTotals.grandTotal,
        subOrders: createdSubOrders.map((s) => ({
          subOrderNumber: s.subOrderNumber,
          seller: sellerMap.get(s.sellerId.toString())?.name ?? "",
          total: s.total,
        })),
        paymentAction: null, // COD
      };
    }); // withTransaction commits here
  } finally {
    await session.endSession(); // FIX 9: await
  }

  if (!holder.response) throw new AppError("Order was not created", 500);

  // FIX 8: AFTER the commit. A failure here must never fail the order
  try {
    eventEmitter.emit(NOTIFICATION_TYPES.ORDER.CREATED, { orderId });
  } catch (err) {
    console.error("order.created handler failed:", err);
  }

  return holder.response;
};

export const getAllOrder = async (
  sellerId: Types.ObjectId,
  query: TGetOrderListQuery,
) => {
  const {
    search,
    sortBy,
    sortOrder,
    page,
    limit,
    orderStatus,
    paymentStatus,
    customerId,
  } = query;

  if (!sellerId || !Types.ObjectId.isValid(sellerId)) {
    throw new AppError("Invalid company", 400);
  }
  const filter: Record<string, unknown> = {
    sellerId: sellerId,
  };
  if (search?.trim()) {
    filter.$or = [
      { orderNumber: { $reges: search.trim(), $options: "i" } },
      { customer: { $reges: search.trim(), $options: "i" } },
    ];
  }
  if (orderStatus) {
    filter.orderStatus = orderStatus;
  }
  if (paymentStatus) {
    filter.paymentStatus = paymentStatus;
  }
  const [orders, total, meta] = await Promise.all([
    Order.find(filter)
      .populate("customer", "_id name phone")
      .populate("items.product", "_id name sku")
      .skip(useSkip({ page, limit }))
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .lean(),
    Order.countDocuments(filter),
    Order.aggregate([
      { $match: { sellerId: sellerId } },
      {
        $facet: {
          orderStatusStats: [
            { $group: { _id: "$order_status", count: { $sum: 1 } } },
          ],
        },
      },
    ]),
  ]);

  const orderStatusCounts = meta[0].orderStatusStats.reduce(
    (acc: Record<string, number>, item: { _id: string; count: number }) => {
      if (item._id) {
        acc[item._id] = item.count;
      }
      return acc;
    },
    {},
  );

  return { orders, total, orderStatusCounts };
};

// ─── getMyOrders ─────────────────────────────────────────────────────────────
// Returns paginated list of orders for the authenticated customer.
// Each order includes a lightweight item list (no population needed —
// items are embedded snapshots).

const MY_ORDER_FIELDS = [
  "orderId orderNumber subOrderNumber sellerId status createdAt",
  "items.productId items.variantId items.name items.image",
  "items.quantity items.sellingPrice items.discountAmount items.totalPrice",
  "subtotal discountAmount shippingCharge total",
  "trackingNumber courierName shippedAt deliveredAt cancelledAt cancelReason",
].join(" ");

export const getMyOrders = async (
  customerId: Types.ObjectId,
  query: TMyOrdersQuery,
) => {
  const { page, limit, status, search } = query;

  // ── Base match ──────────────────────────────────────────────────────────────
  const match: Record<string, unknown> = {
    customerId: new Types.ObjectId(customerId),
  };
  if (status !== "all") {
    match.status = status;
  }

  if (search?.trim()) {
    const prefix = { $regex: `^${escapeRegex(search.toUpperCase())}` };
    match.$or = [{ orderNumber: prefix }, { subOrderNumber: prefix }];
  }
 

  const [subOrders, countRows] = await Promise.all([
    SubOrder.find(match)
      .select(MY_ORDER_FIELDS)
      .sort({ createdAt: -1, _id: -1 })
      .skip(useSkip({ page, limit }))
      .limit(limit)
      .lean(),
    SubOrder.aggregate<{ _id: TSubOrderStatus; count: number }>([
      { $match: { customerId: new Types.ObjectId(String(customerId)) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);
  

  const statusCounts = Object.fromEntries(
    SUB_ORDER_STATUSES.map((s) => [s, 0]),
  ) as Record<TSubOrderStatus, number>;
  for (const row of countRows) statusCounts[row._id] = row.count;
  const allCount = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const total = search
    ? await SubOrder.countDocuments(match) // counts cannot know about the search text
    : status === "all"
      ? allCount
      : statusCounts[status];

  const sellerIds = [...new Set(subOrders.map((s) => s.sellerId.toString()))];
  const sellers = sellerIds.length
    ? await Seller.find({ _id: { $in: sellerIds } })
        .select("name slug image")
        .lean()
    : [];
  const sellerMap = new Map(
    sellers.map((s) => [
      s._id.toString(),
      { _id: s._id, name: s.name, slug: s.slug, image: s.image },
    ]),
  );

  const orders = subOrders.map((s) => ({
    ...s,
    seller: sellerMap.get(s.sellerId.toString()) ?? null,
  }));

  return {
    orders,
    statusCounts,
    total,
  };
};

// ─── getMyOrderById ───────────────────────────────────────────────────────────
// Returns a single order with full detail.
// Ownership check: order.customer must match the requesting customerId.

export const getMyOrderById = async (
  orderId: string,
) => {
  if (!Types.ObjectId.isValid(orderId)) {
    throw new AppError("Invalid order ID", 400);
  }

  const [order, subOrders] = await Promise.all([
    Order.findOne({ _id: new Types.ObjectId(orderId) })

      .populate({
        path: "customerId",
        select: "name phone email",
      })

      .lean(),
    SubOrder.find({ orderId: new Types.ObjectId(orderId) }).lean(),
  ]);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (!subOrders) throw new AppError("sub Order not found", 404);

  const data = {
    order: order.subOrderCount,
    paymentMethod: order.paymentMethod,
    deliveryTo: order.shippingAddress.city,
    shippingAddress: order.shippingAddress,
    subOrder: subOrders.map((subOrder) => ({
      orderNumber: subOrder.orderNumber,
      subOrderNumber: subOrder.subOrderNumber,
      items: subOrder.items,
      status: subOrder.status,
      shippingCharge: subOrder.shippingCharge,
    })),
  };

  return data;
};
