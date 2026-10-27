import { PipelineStage, Types } from "mongoose";
import { TSellerOrderListQuery } from "./subOrder.validation";
import Customer from "../customer/customer.schema";
import { escapeRegex, normalizedBDPhone } from "../../utils/helper";
import { useSkip } from "../../utils/useSkip";
import SubOrder from "./subOrder.schema";
import Order from "../order/order.schema";
import { SUB_ORDER_STATUSES } from "./subOrder.interface";
import { AppError } from "../../middlewares/appError";

const dhakaStart = (day: string) => new Date(`${day}T00:00:00.000+06:00`);
const dhakaEnd = (day: string) => new Date(`${day}T23:59:59.999+06:00`);

const looksLikePhone = (v: string) => /^[\d+\s()-]{7,}$/.test(v);

export const getSellerOrders = async (
  sellerId: Types.ObjectId,
  query: TSellerOrderListQuery,
) => {
  const {
    page,
    limit,
    status,
    payoutStatus,
    search,
    dateFrom,
    dateTo,
    minTotal,
    maxTotal,
    sortBy,
    sortOrder,
  } = query;
  const match: Record<string, unknown> = { sellerId };
  if (status?.length) {
    match.status = status.length === 1 ? status[0] : { $in: status };
  }
  if (payoutStatus) match.payoutStatus = payoutStatus;
  if (dateFrom || dateTo) {
    match.createdAt = {
      ...(dateFrom && { $gte: dhakaStart(dateFrom) }),
      ...(dateTo && { $lte: dhakaEnd(dateTo) }),
    };
  }

  if (search) {
    if (looksLikePhone(search)) {
      const customer = await Customer.findOne({
        phone: normalizedBDPhone(search),
      })
        .select("_id")
        .lean();

      match.customerId = { $in: customer ? [customer._id] : [] };
    } else {
      const rx = new RegExp(`^${escapeRegex(search.toUpperCase())}`);
      match.$or = [{ orderNumber: rx }, { subOrderNumber: rx }];
    }
  }

  const pipeline: PipelineStage[] = [
    { $match: match },
    { $sort: { [sortBy]: sortOrder, _id: sortOrder } }, // _id = stable tie-breaker
    { $skip: useSkip({ page, limit }) },
    { $limit: limit },
    {
      $project: {
        orderId: 1,
        orderNumber: 1,
        subOrderNumber: 1,
        status: 1,
        payoutStatus: 1,
        subtotal: 1,
        discountAmount: 1,
        shippingCharge: 1,
        total: 1,
        commissionRate: 1,
        commissionAmount: 1,
        sellerEarning: 1,
        trackingNumber: 1,
        courierName: 1,
        shippedAt: 1,
        deliveredAt: 1,
        createdAt: 1,
        itemCount: { $size: "$items" },
        totalQuantity: { $sum: "$items.quantity" },
        items: {
          $map: {
            input: { $slice: ["$items", 3] },
            as: "i",
            in: {
              name: "$$i.name",
              sku: "$$i.sku",
              image: "$$i.image",
              quantity: "$$i.quantity",
            },
          },
        },
      },
    },
  ];

  const [rows, total, statusAgg] = await Promise.all([
    SubOrder.aggregate(pipeline),
    SubOrder.countDocuments(match),
    SubOrder.aggregate<{ _id: string; count: number }>([
      { $match: { sellerId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);
  const orderIds = [...new Set(rows.map((r) => r.orderId.toString()))].map(
    (id) => new Types.ObjectId(id),
  );
  const parents = orderIds.length
    ? await Order.find({ _id: { $in: orderIds } })
        .select("shippingAddress paymentMethod paymentStatus note")
        .lean()
    : [];
  const parentMap = new Map(parents.map((o) => [o._id.toString(), o]));
  const orders = rows.map((r) => {
    const parent = parentMap.get(r.orderId.toString());
    return {
      ...r,
      customer: parent
        ? {
            name: parent.shippingAddress.name,
            phone: parent.shippingAddress.phone,
          }
        : null,
      shippingAddress: parent
        ? {
            address: parent.shippingAddress.address,
            city: parent.shippingAddress.city,
            zip: parent.shippingAddress.zip,
          }
        : null,
      payment: parent
        ? {
            method: parent.paymentMethod,
            // NOTE: order-level status (covers all sellers' packages), not per package
            orderPaymentStatus: parent.paymentStatus,
          }
        : null,
      note: parent?.note ?? null,
    };
  });
  const statusCounts: Record<string, number> = { all: 0 };
  SUB_ORDER_STATUSES.forEach((s) => (statusCounts[s] = 0));
  for (const { _id, count } of statusAgg) {
    statusCounts[_id] = count;
    statusCounts.all = (statusCounts.all ?? 0) + count;
  }
  return { orders, total, statusCounts };
};

export const getSellerOrderById = async (
  orderId: string,
  sellerId: Types.ObjectId,
) => {
  const sub = await SubOrder.findOne({
    orderId: new Types.ObjectId(orderId),
    sellerId,
  }).lean();
  if (!sub) throw new AppError("Order not found", 404);

  const [order, customer] = await Promise.all([
    Order.findById(sub.orderId)
      .select(
        "orderNumber createdAt shippingAddress paymentMethod paymentStatus note",
      )
      .lean(),
    Customer.findById(sub.customerId).select("name phone").lean(),
  ]);
  if (!order) throw new AppError("Order not found", 404);
   const isCOD = order.paymentMethod === "cash_on_delivery";

   return {
    orderId: order._id,
    orderNumber: order.orderNumber,
    subOrderId: sub._id,
    subOrderNumber: sub.subOrderNumber,
    createdAt: order.createdAt,
    status: sub.status,
    statusHistory: sub.statusHistory,

    customer: {
      name: customer?.name ,
      phone: customer?.phone ?? order.shippingAddress.phone,
    },
    shippingAddress: order.shippingAddress,
    note: order.note,

    payment: {
      method: order.paymentMethod,
      cashToCollect: isCOD ? sub.total : 0,
    },

    items: sub.items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId,
      name: i.name,
      sku: i.sku,
      image: i.image,
      quantity: i.quantity,
      sellingPrice: i.sellingPrice,
      discountAmount: i.discountAmount,
      totalPrice: i.totalPrice,
    })),

    totals: {
      subtotal: sub.subtotal,
      discountAmount: sub.discountAmount,
      shippingCharge: sub.shippingCharge,
      total: sub.total,
    },

    earnings: {
      commissionRate: sub.commissionRate,
      commissionAmount: sub.commissionAmount,
      sellerEarning: sub.sellerEarning,
      payoutStatus: sub.payoutStatus,
      payoutReleaseAt: sub.payoutReleaseAt,
    },

    shipping: {
      trackingNumber: sub.trackingNumber,
      courierName: sub.courierName,
      shippedAt: sub.shippedAt,
      deliveredAt: sub.deliveredAt,
      cancelledAt: sub.cancelledAt,
      cancelReason: sub.cancelReason,
    },
  };
};
