"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSale = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const generateSaleCode_1 = require("../../utils/generateSaleCode");
const appError_1 = require("../../middlewares/appError");
const product_schema_1 = __importDefault(require("../../module/product/product.schema"));
const product_variant_schema_1 = __importDefault(require("../../module/product-variant/product-variant.schema"));
const customer_schema_1 = __importDefault(require("../customer/customer.schema"));
const healper_1 = require("../../utils/healper");
const posSell_schema_1 = __importDefault(require("./posSell.schema"));
// ─── Helpers ──────────────────────────────────────────────
const OFFLINE_PAYMENT_METHODS = new Set(["cash", "cash_on_delivery", "credit"]);
const getPOSLevelDiscount = (amountAfterItemDiscounts, discountType, discountValue) => {
    if (!discountType || !discountValue || discountValue <= 0)
        return 0;
    const raw = (0, healper_1.calculateDiscount)({
        sellingPrice: amountAfterItemDiscounts,
        quantity: 1,
        discountType,
        discountValue,
    });
    return Math.min(Math.max(raw, 0), amountAfterItemDiscounts);
};
const getItemPricing = (product, variant) => {
    const sellingPrice = variant.sellingPrice;
    const discountValue = Math.min(Math.max(product.discount ?? 0, 0), 100);
    const discountType = discountValue > 0 ? "percentage" : null;
    return { sellingPrice, discountType, discountValue };
};
const getAttribute = (attributes, key) => attributes.find((a) => a.key === key)?.value ?? "";
const resolveCustomer = async (sellerId, netAmount, effectivePaid, session, customerId) => {
    // Walk-in sale — no customer attached, nothing to resolve.
    if (!customerId)
        return null;
    const existing = await customer_schema_1.default.findOne({
        sellerId,
        _id: new mongoose_1.Types.ObjectId(customerId),
    }).session(session);
    if (!existing) {
        throw new appError_1.AppError("Customer not found", 404);
    }
    const updated = await customer_schema_1.default.findOneAndUpdate({ _id: existing._id }, [
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
                lastPurchasedAt: new Date(),
            },
        },
    ], { session, returnDocument: "after", updatePipeline: true });
    if (!updated)
        throw new appError_1.AppError("Failed to update customer", 500);
    return { _id: updated._id, name: updated.name, phone: updated.phone };
};
// ─── Main Service ─────────────────────────────────────────
// export const createSale = async (payload: ICreateSalePayload) => {
//   const { sellerId, createdBy, input, createdByType } = payload;
//   const {
//     customerName,
//     customerPhone,
//     customerEmail,
//     customerId: customer_id,
//     customer,
//     items,
//     paymentMethod,
//     paidAmount,
//     note,
//     discountType,
//     discountValue,
//   } = input;
//   // 1. block online payments
//   if (paymentMethod === "card" || paymentMethod === "mobile_banking") {
//     throw new AppError(
//       "Online payments must use /orders/initiate endpoint",
//       400,
//     );
//   }
//   const session = await mongoose.startSession();
//   try {
//     session.startTransaction();
//     const sellerObjectId = new Types.ObjectId(sellerId);
//     // 2. load all products in one query
//     const productIds = items.map((i) => new Types.ObjectId(i.productId));
//     const products = await Product.find({
//       _id: { $in: productIds },
//       sellerId: sellerObjectId,
//       isActive: true,
//     }).session(session);
//     // check all products found
//     const uniqueProductIds = new Set(items.map((i) => i.productId));
//     if (products.length !== uniqueProductIds.size) {
//       throw new AppError("One or more products not found", 404);
//     }
//     // build product map → productId: product
//     const productMap = new Map(products.map((p) => [p._id.toString(), p]));
//     // 3. load all variants in one query
//     const variantIds = items.map((i) => new Types.ObjectId(i.variantId));
//     const variants = await ProductVariant.find({
//       _id: { $in: variantIds },
//       sellerId: sellerObjectId,
//       isActive: true,
//     }).session(session);
//     if (variants.length !== items.length) {
//       throw new AppError("One or more variants not found", 404);
//     }
//     // build variant map → variantId: variant
//     const variantMap = new Map(variants.map((v) => [v._id.toString(), v]));
//     // 4. validate stock + build calculated items
//     const calculatedItems: CalculatedItem[] = [];
//     for (const item of items) {
//       const product = productMap.get(item.productId);
//       const variant = variantMap.get(item.variantId);
//       if (!product)
//         throw new AppError(`Product not found: ${item.productId}`, 404);
//       if (!variant)
//         throw new AppError(`Variant not found: ${item.variantId}`, 404);
//       // check variant belongs to this product
//       if (variant.productId.toString() !== item.productId) {
//         throw new AppError(
//           `Variant ${item.variantId} does not belong to product ${item.productId}`,
//           400,
//         );
//       }
//       // check stock
//       if (variant.stock < item.quantity) {
//         throw new AppError(
//           `Insufficient stock for ${product.name} - ${variant.sku}. Available: ${variant.stock}`,
//           400,
//         );
//       }
//       // extract color and size from attributes
//       const color = getAttribute(variant.attributes, "color");
//       const size = getAttribute(variant.attributes, "size");
//       // calculate discount
//       const discountAmount = calculateDiscount({
//         sellingPrice: item.sellingPrice,
//         quantity: item.quantity,
//         discountType: item.discountType ?? null,
//         discountValue: item.discountValue,
//       });
//       console.log(discountAmount);
//       const subtotal = item.sellingPrice * item.quantity - discountAmount;
//       calculatedItems.push({
//         productId: new Types.ObjectId(item.productId),
//         variantId: new Types.ObjectId(item.variantId),
//         productName: product.name,
//         color,
//         size,
//         sku: variant.sku,
//         quantity: item.quantity,
//         unitPrice: variant.buyingPrice, // from variant — actual cost
//         sellingPrice: item.sellingPrice,
//         discountType: item.discountType ?? null,
//         discountValue: item.discountValue,
//         discountAmount,
//         subtotal,
//       });
//     }
//     // 5. calculate totals
//     const grossAmount = calculatedItems.reduce(
//       (sum, i) => sum + i.sellingPrice * i.quantity,
//       0,
//     );
//     const discountTotal = calculatedItems.reduce(
//       (sum, i) => sum + i.discountAmount,
//       0,
//     );
//     const netAmount = grossAmount - discountTotal;
//     // 6. calculate payment status
//     const effectivePaid = paymentMethod === "cash_on_delivery" ? 0 : paidAmount;
//     const dueAmount = Math.max(netAmount - effectivePaid, 0);
//     const changeAmount = Math.max(effectivePaid - netAmount, 0);
//     const paymentStatus =
//       effectivePaid <= 0
//         ? "due"
//         : effectivePaid >= netAmount
//           ? "paid"
//           : "partial";
//     // 7. resolve or create customer
//     const customerId = await resolveCustomer(
//       sellerObjectId,
//       netAmount,
//       effectivePaid,
//       session,
//       customer?.name,
//       customer?.phone,
//     );
//     // 8. deduct stock for each variant
//     for (const item of calculatedItems) {
//       await ProductVariant.updateOne(
//         {
//           _id: item.variantId,
//           sellerId: sellerObjectId,
//         },
//         { $inc: { stock: -item.quantity } },
//         { session },
//       );
//     }
//     // 9. generate sale code
//     const saleCode = await generateSaleCode(sellerId);
//     // 10. create sale
//     const [sale] = await PosSale.create(
//       [
//         {
//           sellerId: sellerObjectId,
//           saleCode,
//           ...(customerName &&
//             customerPhone && {
//               customer: {
//                 name: customerName,
//                 phone: customerPhone,
//                 customerId, // CRM link comes later
//               },
//             }),
//           items: calculatedItems,
//           grossAmount,
//           discountTotal,
//           netAmount,
//           paidAmount: effectivePaid,
//           dueAmount,
//           changeAmount,
//           paymentMethod,
//           paymentStatus,
//           creditUsed: 0,
//           saleDate: new Date(),
//           note: note ?? null,
//           status: "completed",
//           createdBy: createdBy,
//           createdByType,
//         },
//       ],
//       { session },
//     );
//     await session.commitTransaction();
//     return sale;
//   } catch (error) {
//     await session.abortTransaction();
//     throw error;
//   } finally {
//     session.endSession();
//   }
// };
const createSale = async (payload) => {
    const { sellerId, createdBy, input, createdByType } = payload;
    const { customerId: inputCustomerId, items, paymentMethod, paidAmount, note, discountType: posDiscountType, discountValue: posDiscountValue, } = input;
    // 1. block online payments — this endpoint is offline-only
    if (!OFFLINE_PAYMENT_METHODS.has(paymentMethod)) {
        throw new appError_1.AppError("Online payments must use /orders/initiate endpoint", 400);
    }
    if (paidAmount < 0) {
        throw new appError_1.AppError("Paid amount cannot be negative", 400);
    }
    const sellerObjectId = new mongoose_1.Types.ObjectId(sellerId);
    // Reject duplicate line items up front — same variant twice means the
    // client should have merged quantities, and it also breaks our
    // "one map entry per id" assumption below.
    const variantIdCounts = new Map();
    console.log("variantIdCounts", variantIdCounts);
    for (const item of items) {
        variantIdCounts.set(item.variantId, (variantIdCounts.get(item.variantId) ?? 0) + 1);
    }
    const duplicateVariant = [...variantIdCounts.entries()].find(([, count]) => count > 1);
    if (duplicateVariant) {
        throw new appError_1.AppError(`Duplicate item in cart for variant ${duplicateVariant[0]}`, 400);
    }
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        // 2. load all products in one query
        const productIds = [...new Set(items.map((i) => i.productId))].map((id) => new mongoose_1.Types.ObjectId(id));
        console.log("productIds", productIds);
        const products = await product_schema_1.default.find({
            _id: { $in: productIds },
            sellerId: sellerObjectId,
            isActive: true,
        }).session(session);
        if (products.length !== productIds.length) {
            throw new appError_1.AppError("One or more products not found", 404);
        }
        const productMap = new Map(products.map((p) => [p._id.toString(), p]));
        // 3. load all variants in one query
        const variantIds = items.map((i) => new mongoose_1.Types.ObjectId(i.variantId));
        const variants = await product_variant_schema_1.default.find({
            _id: { $in: variantIds },
            sellerId: sellerObjectId,
            isActive: true,
        }).session(session);
        if (variants.length !== items.length) {
            throw new appError_1.AppError("One or more variants not found", 404);
        }
        const variantMap = new Map(variants.map((v) => [v._id.toString(), v]));
        // 4. validate stock + build calculated items (server-priced, not client-priced)
        const calculatedItems = [];
        for (const item of items) {
            const product = productMap.get(item.productId);
            // console.log("product", product);
            const variant = variantMap.get(item.variantId);
            // console.log("variant", variant);
            if (!product)
                throw new appError_1.AppError(`Product not found: ${item.productId}`, 404);
            if (!variant)
                throw new appError_1.AppError(`Variant not found: ${item.variantId}`, 404);
            if (variant.productId.toString() !== item.productId) {
                throw new appError_1.AppError(`Variant ${item.variantId} does not belong to product ${item.productId}`, 400);
            }
            if (item.quantity <= 0) {
                throw new appError_1.AppError(`Invalid quantity for ${product.name} - ${variant.sku}`, 400);
            }
            if (variant.stock < item.quantity) {
                throw new appError_1.AppError(`Insufficient stock for ${product.name} - ${variant.sku}. Available: ${variant.stock}`, 400);
            }
            const color = getAttribute(variant.attributes, "color");
            console.log("color", color);
            const size = getAttribute(variant.attributes, "size");
            console.log("size", size);
            // ── SECURITY: sellingPrice + discount are always server-derived.
            const { sellingPrice, discountType, discountValue } = getItemPricing(product, variant);
            console.log("sellingPrice,", sellingPrice);
            console.log("discountType, ", discountType);
            console.log(" discountValue", discountValue);
            const discountAmount = (0, healper_1.calculateDiscount)({
                sellingPrice,
                quantity: item.quantity,
                discountType,
                discountValue,
            });
            console.log("selling price after discount", discountAmount);
            const lineTotal = sellingPrice * item.quantity - discountAmount;
            calculatedItems.push({
                productId: new mongoose_1.Types.ObjectId(item.productId),
                variantId: new mongoose_1.Types.ObjectId(item.variantId),
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
        console.log("calculatedItems", calculatedItems);
        // 5. calculate totals
        const grossAmount = calculatedItems.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0);
        console.log("grossAmount", grossAmount);
        const itemDiscountTotal = calculatedItems.reduce((sum, i) => sum + i.discountAmount, 0);
        console.log("itemDiscountTotal", itemDiscountTotal);
        const amountAfterItemDiscounts = grossAmount - itemDiscountTotal;
        console.log("amountAfterItemDiscounts", amountAfterItemDiscounts);
        // Order-level discount: manually entered by the cashier at checkout,
        // applied once on top of item discounts, clamped so it can't go negative.
        const posDiscountAmount = getPOSLevelDiscount(amountAfterItemDiscounts, posDiscountType ?? null, posDiscountValue ?? 0);
        const discountTotal = itemDiscountTotal + posDiscountAmount;
        const netAmount = Math.max(grossAmount - discountTotal, 0);
        // 6. calculate payment status
        // cash_on_delivery: nothing collected yet at sale time.
        // credit: sale is fully on account, nothing collected now either.
        const effectivePaid = paymentMethod === "cash_on_delivery" || paymentMethod === "credit"
            ? 0
            : Math.min(paidAmount, netAmount === 0 ? paidAmount : Infinity);
        const dueAmount = Math.max(netAmount - effectivePaid, 0);
        const changeAmount = Math.max(effectivePaid - netAmount, 0);
        const paymentStatus = effectivePaid <= 0
            ? "due"
            : effectivePaid >= netAmount
                ? "paid"
                : "partial";
        // 7. resolve or create customer
        const resolvedCustomer = await resolveCustomer(sellerObjectId, netAmount, effectivePaid, session, inputCustomerId);
        // 8. deduct stock atomically — guard against a race between the read in
        // step 3 and this write by requiring stock to still be sufficient.
        for (const item of calculatedItems) {
            const result = await product_variant_schema_1.default.updateOne({
                _id: item.variantId,
                sellerId: sellerObjectId,
                stock: { $gte: item.quantity },
            }, { $inc: { stock: -item.quantity } }, { session });
            if (result.matchedCount === 0) {
                throw new appError_1.AppError(`Stock changed for ${item.productName} (${item.sku}) — please refresh and try again`, 409);
            }
        }
        // 9. generate sale code
        const saleCode = await (0, generateSaleCode_1.generateSaleCode)(sellerId);
        // 10. create sale
        const [sale] = await posSell_schema_1.default.create([
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
        ], { session });
        if (!sale)
            throw new appError_1.AppError("Sale not created", 400);
        await session.commitTransaction();
        return sale;
    }
    catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
};
exports.createSale = createSale;
//# sourceMappingURL=posSell.service.js.map