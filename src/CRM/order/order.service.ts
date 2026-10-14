import { calculateSubOrderMoney } from "./../../utils/order.pricing";
import mongoose, { Types } from "mongoose";
import { generateSaleCode } from "../../utils/generateSaleCode";
import { AppError } from "../../middlewares/appError";
import Product from "../../module/product/product.schema";
import ProductVariant from "../../module/product-variant/product-variant.schema";
import Customer from "../customer/customer.schema";
import {
  ICreateOrderPayload,
  IEmptyOrderItem,
  IGetMyOrdersQuery,
  IOrderItem,
  OrderQuery,
} from "./order.interface";
import { generateInvoiceNumber, generateOderNumber } from "../../utils/healper";
import Order from "./order.schema";
import { useSkip } from "../../utils/useSkip";
import {
  TCreateOrderInput,
  TGetOrderListQuery,
  TShippingAddress,
} from "./order.validation";
import Invoice from "../invoice/invoice.schema";
import User from "../../module/user/user.schema";
import { PaymentStatus } from "../posSell/posSell.interface";
import { eventEmitter } from "../../shared/events";
import { NOTIFICATION_TYPES } from "../../shared/notifications/constants";
import {
  generateOrderNumber,
  generateSubOrderNumber,
} from "../../utils/orderHelper";
import { Seller } from "../../module/seller/seller.schema";
import { boolean } from "zod";
import {
  calculateDiscount,
  calculateTaxRate,
  normalizedBDPhone,
} from "../../utils/helper";
import { ICustomerAddress } from "../customer/customer.interface";
import {
  TSubOrderDraft,
  TSubOrderLineDraft,
} from "../subOrder/subOrder.interface";
import { round2 } from "../../utils/money";
import SubOrder from "../subOrder/subOrder.schema";

// const resolveCustomer = async (
//   sellerId: Types.ObjectId,
//   name: string,
//   phone: string,
//   email: string,
//   shipping_address: TShippingAddress,
//   session: mongoose.ClientSession,
//   userId?: Types.ObjectId,
// ) => {
//   //check shipping address is same as customer address
//   const isSamePerson =
//     shipping_address?.phone === phone && shipping_address.name === name;
//   const newAddress = isSamePerson
//     ? {
//         label: "home",
//         district: shipping_address.city,
//         area: shipping_address.address,
//         zip: shipping_address.zip,
//         isDefault: true,
//       }
//     : null;
//   // console.log(userId)
//   // check is exist customer
//   const existing = await Customer.findOne({
//     sellerId,
//     $or: [...(userId ? [{ userId }] : []), { phone }, { email }],
//   }).session(session);

//   if (existing) {
//     // check if exist this address
//     const addressExists = newAddress
//       ? existing.addresses.some(
//           (addr) =>
//             addr.district === newAddress.district &&
//             addr.area === newAddress.area,
//         )
//       : false;
//     await Customer.updateOne(
//       { _id: existing._id },
//       {
//         $set: {
//           name,
//           ...(email && { email }),
//           ...(userId && { userId }),
//         },
//         // only push if address is new
//         ...(!addressExists &&
//           newAddress && {
//             $push: {
//               addresses: newAddress,
//             },
//           }),
//       },
//       { runValidators: true, session },
//     );
//     if (userId && !existing.userId) {
//       await User.updateOne(
//         {
//           _id: userId,
//           profileId: null,
//         },
//         {
//           $set: { profileId: existing._id, profileType: "Customer" },
//         },
//         { session },
//       );
//     }
//     return existing._id;
//   }

//   // create new customer
//   const [customer] = await Customer.create(
//     [
//       {
//         sellerId,
//         name,
//         ...(email !== null && { email }),
//         phone,
//         ...(userId && { userId }),
//         addresses: newAddress ? [newAddress] : [],
//       },
//     ],
//     { session },
//   );
//   if (!customer) {
//     throw new AppError("Failed to create customer");
//   }
//   if (userId) {
//     await Promise.all([
//       User.updateOne(
//         { _id: userId, profileId: null },
//         { $set: { profileId: customer._id, profileType: "Customer" } },
//         { session },
//       ),
//       User.updateOne(
//         {
//           _id: userId,
//           $or: [{ phone: { $exists: false } }, { phone: null }, { phone: "" }],
//         },
//         { $set: { phone } },
//         { session },
//       ),
//     ]);
//   }
//   return customer._id;
// };

interface IResolveCustomerInput {
  name: string;
  phone: string;
  email: string;
  shippingAddress: TShippingAddress;
  session: mongoose.ClientSession;
}

const resolveCustomer = async (input: IResolveCustomerInput) => {
  const { name, phone, email, shippingAddress, session } = input;
  const isSameCustomer = [
    name === shippingAddress.name,
    phone === shippingAddress.phone,
  ].every(Boolean);
  const normalizedPhone = normalizedBDPhone(phone);
  const existingCustomer = await Customer.findOne({
    $or: [{ phone: normalizedPhone }, { email }],
  })
    .select("userId _id addresses")
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

  return existingCustomer;
};

export const createOrder = async (input: TCreateOrderInput) => {
  const {
    name,
    phone,
    email,
    items,
    shippingAddress,
    shippingCharge,
    paymentMethod,
    note,
  } = input;

  // order Number generation
  const orderNumber = await generateOrderNumber();
  const orderId = new Types.ObjectId();
  const paymentId = new Types.ObjectId();
  const variantIds = items.map((item) => new Types.ObjectId(item.variantId));

  const variants = await ProductVariant.find({
    _id: { $in: variantIds },
    isActive: true,
  })
    .select(
      "_id productId sellerId sku image attributes  sellingPrice stock discountType discountValue ",
    )
    .lean();
  if (variants.length !== items.length) {
    throw new AppError("One or more variants not found or inactive", 404);
  }
  const productIds = variants.map((v) => v.productId);
  const products = await Product.find({
    _id: { $in: productIds },
    isActive: true,
  })
    .select("_id sellerId  name slug  taxRate isActive discount hasDiscount ")
    .lean();

  const sellerIds = products.map((p) => p.sellerId);

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

  for (const item of items) {
    const variant = variantMap.get(item.variantId);
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
    const lineBase = sellingPrice * quantity;
    const discountAmount = calculateDiscount({
      lineBase,
      discountValue: variant.discountValue,
      discountType: variant.discountType,
      quantity,
    });
    if (lineBase < discountAmount) {
      throw new AppError("Discount amount cannot exceed the total price", 400);
    }
    const totalPrice = lineBase - discountAmount;
    // const taxAmount = calculateTaxRate({totalPrice,taxRate: variant})

    const key = variant.sellerId.toString();
    if (!group.has(key)) group.set(key, []);
    group.get(key)!.push({
      productId: variant.productId,
      variantId: new Types.ObjectId(item.variantId),
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

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const customer = await resolveCustomer({
      name,
      phone,
      email,
      shippingAddress,
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
      const current = await ProductVariant.find({
        _id: { $in: allLines.map((l) => l.variantId) },
      })
        .select("_id stock")
        .lean();
      const stockMap = new Map(current.map((v) => [v._id.toString(), v.stock]));
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

    const [order] = await Order.create(
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
    console.log("order", order);

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
        status: "pending",
        statusHistory: [
          { status: "pending", at: new Date(), by: null, note: "Order placed" },
        ],
      })),
      { session, ordered: true },
    );

    console.log("createdSubOrders", createdSubOrders);
    // await session.commitTransaction();

    return {
      orderNumber,
      variants,
      products,
      sellers,
      customer,
      subOrderDrafts,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// console.log(customer);

// const session = await mongoose.startSession();
// try {
//   await session.startTransaction();
//   // 1. load all variant
//   const variantIds = items.map((i) => new Types.ObjectId(i.variant_id));
//   const variants = await ProductVariant.find({
//     sellerId: sellerId,
//     isActive: true,
//     _id: { $in: variantIds },
//   }).session(session);
//   console.log("variants", variants);
//   if (variants.length < items.length) {
//     throw new AppError("One or more variants not found or inactive", 404);
//   }
//   const variantMap = new Map(variants.map((v) => [v._id.toString(), v]));

//   // 2. load all products
//   const productIds = variants.map((v) => v.productId);
//   const product = await Product.find({
//     sellerId: sellerId,
//     isActive: true,
//     _id: { $in: productIds },
//   }).session(session);
//   console.log("product", product);
//   const productMap = new Map(product.map((p) => [p._id.toString(), p]));
//   // 3 validate stock
//   const orderItem: IOrderItem[] = [];

//   for (const item of items) {
//     const variant = variantMap.get(item.variant_id);
//     if (!variant) {
//       throw new AppError(`Not found this ${item.variant_id} `, 404);
//     }
//     const product = productMap.get(variant.productId.toString());
//     if (!product) {
//       throw new AppError(
//         `Product not found for variant: ${item.variant_id} `,
//         404,
//       );
//     }
//     if (variant.stock < item.quantity) {
//       throw new AppError(
//         `Insufficient stock for ${product.name} - ${variant.sku}. Available: ${variant.stock}`,
//         400,
//       );
//     }
//     const unitPrice = variant.sellingPrice;
//     const taxRate = product.taxRate;
//     const taxAmount = Math.round((unitPrice * item.quantity * taxRate) / 100);

//     const discountAmount = calculateDiscount({
//       sellingPrice: unitPrice,
//       quantity: item.quantity,
//       discountType: variant.discountType ?? null,
//       discountValue: variant.discountValue ?? 0,
//     });
//     const totalPrice = unitPrice * item.quantity - discountAmount;
//     orderItem.push({
//       totalPrice: totalPrice,
//       sellingPrice: unitPrice,
//       quantity: item.quantity,
//       sku: variant.sku,
//       name: product.name,
//       image: variant.image,
//       variant: variant._id,
//       product: product._id,
//       discountType: variant.discountType ?? null,
//       discountValue: variant.discountValue ?? 0,
//       discountAmount,
//       taxAmount,
//       taxRate,
//     });
//   }
//   // 4. calculate total
//   const subTotal = orderItem.reduce((sum, item) => sum + item.totalPrice, 0);
//   const discountTotal = orderItem.reduce(
//     (sum, item) => sum + item.discountAmount,
//     0,
//   );
//   const shippingCharge = 60;
//   const totalTax = orderItem.reduce((sum, item) => sum + item.taxAmount, 0);
//   const grandTotal = subTotal + totalTax + shippingCharge;
//   //  check is paid or unpaid or partial
//   const effectivePaid =
//     paymentMethod === "cash_on_delivery"
//       ? 0
//       : Math.min(paidAmount, grandTotal);
//   const dueAmount = Math.max(grandTotal - effectivePaid, 0);

//   let paymentStatus: PaymentStatus;
//   if (paymentMethod === "cash_on_delivery") {
//     paymentStatus = "due";
//   } else {
//     paymentStatus =
//       effectivePaid <= 0
//         ? "due"
//         : effectivePaid >= grandTotal
//           ? "paid"
//           : "partial";
//   }
//   // 5. resolve customer
//   const customerId = await resolveCustomer(
//     sellerId,
//     name,
//     phone,
//     email,
//     shippingAddress,
//     session,
//     userId ? new Types.ObjectId(userId) : undefined,
//   );
//   // 6. update customer info

//   await Customer.updateOne(
//     { _id: customerId },
//     [
//       {
//         $set: {
//           totalPurchased: { $add: ["$totalPurchased", grandTotal] },
//           totalPaid: { $add: ["$totalPaid", effectivePaid] },
//           due: {
//             $max: [
//               0,
//               {
//                 $subtract: [
//                   { $add: ["$totalPurchased", grandTotal] },
//                   { $add: ["$totalPaid", effectivePaid] },
//                 ],
//               },
//             ],
//           },
//           credit: {
//             $max: [
//               0,
//               {
//                 $subtract: [
//                   { $add: ["$totalPaid", effectivePaid] },
//                   { $add: ["$totalPurchased", grandTotal] },
//                 ],
//               },
//             ],
//           },
//           lastPurchasedAt: new Date(),
//         },
//       },
//     ],
//     { session, updatePipeline: true },
//   );

//   //7. deduct stock
//   for (const item of orderItem) {
//     await ProductVariant.updateOne(
//       { _id: item.variant },
//       {
//         $inc: { stock: -item.quantity },
//       },
//       {
//         session,
//       },
//     );
//   }
//   //8 generate order
//   const orderNumber = await generateOderNumber(sellerId);
//   //9 create order
//   const [order] = await Order.create(
//     [
//       {
//         sellerId: sellerId,
//         orderNumber: orderNumber,
//         customer: customerId,
//         items: orderItem,
//         shippingAddress,
//         subtotal: subTotal,
//         discountAmount: discountTotal,
//         taxAmount: orderItem.reduce((sum, item) => sum + item.taxAmount, 0),
//         shippingCharge: shippingCharge,
//         grandTotal: grandTotal,
//         paidAmount: effectivePaid,
//         dueAmount: dueAmount,
//         paymentStatus: paymentStatus,
//         paymentMethod,
//         orderStatus: "pending",
//         note: note ?? null,
//       },
//     ],
//     { session },
//   );
//   if (!order) {
//     throw new AppError("Failed to order", 400);
//   }
//   const invoiceNumber = await generateInvoiceNumber();
//   const deliveryDate = new Date();
//   deliveryDate.setDate(deliveryDate.getDate() + 7);
//   await Invoice.create(
//     [
//       {
//         invoiceNumber,
//         order: order._id,
//         sellerId: sellerId,
//         customer: order.customer,
//         items: order.items,
//         subtotal: order.subtotal,
//         discountAmount: order.discountAmount,
//         taxAmount: order.taxAmount,
//         shippingCharge: order.shippingCharge,
//         grandTotal: order.grandTotal,
//         paidAmount: order.paidAmount,
//         dueAmount: order.dueAmount,
//         paymentMethod: order.paymentMethod,
//         status: order.paymentStatus,
//         issuedAt: new Date(),
//         deliveryDate,
//         paidDate: paymentStatus === "paid" ? new Date() : null,
//         note: order.note,
//       },
//     ],
//     { session },
//   );
//   // next apply here send email
//   await session.commitTransaction();
//   console.log(`\n📤 Emitting order.created event for #${order.orderNumber}`);
//   eventEmitter.emit(NOTIFICATION_TYPES.ORDER.CREATED, {
//     order,
//     customerId,
//     sellerId,
//   });
//   return order;
// } catch (error) {
//   await session.abortTransaction();
//   throw error;
// } finally {
//   session.endSession();
// }

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

export const getMyOrders = async (
  customerId: Types.ObjectId,
  sellerId: Types.ObjectId,
  query: IGetMyOrdersQuery,
) => {
  const { page = 1, limit = 10, orderStatus, search } = query;

  const skip = (page - 1) * limit;

  // ── Base match ──────────────────────────────────────────────────────────────
  const match: Record<string, unknown> = {
    sellerId: new Types.ObjectId(sellerId),
    customer: new Types.ObjectId(customerId),
  };
  console.log(match);
  if (orderStatus && orderStatus !== "all") {
    match.orderStatus = orderStatus;
  }

  if (search?.trim()) {
    // order_number is a plain string field — safe to use $regex
    match.order_number = {
      $regex: search.trim(),
      $options: "i",
    };
  }

  // ── Aggregation ─────────────────────────────────────────────────────────────
  const [result] = await Order.aggregate([
    { $match: match },
    {
      $facet: {
        orders: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              order_number: 1,
              order_status: 1,
              payment_status: 1,
              payment_method: 1,
              items: {
                $map: {
                  input: "$items",
                  as: "item",
                  in: {
                    name: "$$item.name",
                    sku: "$$item.sku",
                    quantity: "$$item.quantity",
                    unit_price: "$$item.unit_price",
                    total_price: "$$item.total_price",
                    image: "$$item.image", // ✅ directly from snapshot
                  },
                },
              },
              subtotal: 1,
              discount_amount: 1,
              tax_amount: 1,
              shipping_charge: 1,
              grand_total: 1,
              paid_amount: 1,
              due_amount: 1,
              shipping_address: 1,
              note: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
        total: [{ $count: "count" }],
        // Status counts for tab badges on the frontend
        statusCounts: [
          {
            $group: {
              _id: "$order_status",
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  const orders = result?.orders ?? [];
  const total = result?.total?.[0]?.count ?? 0;

  // Reshape statusCounts: [{ _id: "pending", count: 2 }] → { pending: 2, ... }
  const statusCounts: Record<string, number> = {};
  for (const s of result?.statusCounts ?? []) {
    statusCounts[s._id] = s.count;
  }

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
  // customerId: Types.ObjectId,
  // sellerId: Types.ObjectId,
) => {
  if (!Types.ObjectId.isValid(orderId)) {
    throw new AppError("Invalid order ID", 400);
  }

  const order = await Order.findOne({ _id: new Types.ObjectId(orderId) })
    .populate({
      path: "items.product",
      select: "name slug images",
    })
    .populate({
      path: "items.variant",
      select: "sku image attributes sellingPrice stock",
    })
    .populate({
      path: "customer",
      select: "name phone email",
    })
    .populate({
      path: "sellerId",
      select: "name storeName",
    })
    .lean();
  console.log(order);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  return order;
};
