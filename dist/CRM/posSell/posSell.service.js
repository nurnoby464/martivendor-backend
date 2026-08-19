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
const posSell_schema_1 = __importDefault(require("./posSell.schema"));
const customer_schema_1 = __importDefault(require("../customer/customer.schema"));
const healper_1 = require("../../utils/healper");
// ─── Helpers ──────────────────────────────────────────────
const getAttribute = (attributes, key) => attributes.find((a) => a.key === key)?.value ?? "";
const resolveCustomer = async (sellerId, netAmount, effectivePaid, session, customerName, customerPhone, customerId) => {
    let existing = null;
    if (customerId || customerPhone) {
        existing = await customer_schema_1.default.findOne({
            sellerId,
            $or: [
                ...(sellerId ? [{ _id: new mongoose_1.Types.ObjectId(sellerId) }] : []),
                ...(customerPhone ? [{ phone: customerPhone }] : []),
            ],
        }).session(session);
    }
    if (existing) {
        await customer_schema_1.default.updateOne({ _id: existing._id }, [
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
    const [customer] = await customer_schema_1.default.create([
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
    ], { session });
    if (!customer)
        throw new appError_1.AppError("Customer not created", 400);
    return customer._id;
};
// ─── Main Service ─────────────────────────────────────────
const createSale = async (payload) => {
    const { sellerId, createdBy, input, createdByType } = payload;
    const { customerName, customerPhone, customerEmail, customerId: customer_id, items, paymentMethod, paidAmount, note, } = input;
    // 1. block online payments
    if (paymentMethod === "card" || paymentMethod === "mobile_banking") {
        throw new appError_1.AppError("Online payments must use /orders/initiate endpoint", 400);
    }
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const companyObjectId = new mongoose_1.Types.ObjectId(sellerId);
        // 2. load all products in one query
        const productIds = items.map((i) => new mongoose_1.Types.ObjectId(i.productId));
        const products = await product_schema_1.default.find({
            _id: { $in: productIds },
            sellerId: companyObjectId,
            is_active: true,
        }).session(session);
        // check all products found
        const uniqueProductIds = new Set(items.map((i) => i.productId));
        if (products.length !== uniqueProductIds.size) {
            throw new appError_1.AppError("One or more products not found", 404);
        }
        // build product map → productId: product
        const productMap = new Map(products.map((p) => [p._id.toString(), p]));
        // 3. load all variants in one query
        const variantIds = items.map((i) => new mongoose_1.Types.ObjectId(i.variantId));
        const variants = await product_variant_schema_1.default.find({
            _id: { $in: variantIds },
            sellerId: companyObjectId,
            is_active: true,
        }).session(session);
        if (variants.length !== items.length) {
            throw new appError_1.AppError("One or more variants not found", 404);
        }
        // build variant map → variantId: variant
        const variantMap = new Map(variants.map((v) => [v._id.toString(), v]));
        // 4. validate stock + build calculated items
        const calculatedItems = [];
        for (const item of items) {
            const product = productMap.get(item.productId);
            const variant = variantMap.get(item.variantId);
            if (!product)
                throw new appError_1.AppError(`Product not found: ${item.productId}`, 404);
            if (!variant)
                throw new appError_1.AppError(`Variant not found: ${item.variantId}`, 404);
            // check variant belongs to this product
            if (variant.productId.toString() !== item.productId) {
                throw new appError_1.AppError(`Variant ${item.variantId} does not belong to product ${item.productId}`, 400);
            }
            // check stock
            if (variant.stock < item.quantity) {
                throw new appError_1.AppError(`Insufficient stock for ${product.name} - ${variant.sku}. Available: ${variant.stock}`, 400);
            }
            // extract color and size from attributes
            const color = getAttribute(variant.attributes, "color");
            const size = getAttribute(variant.attributes, "size");
            // calculate discount
            const discountAmount = (0, healper_1.calculateDiscount)({
                sellingPrice: item.sellingPrice,
                quantity: item.quantity,
                discountType: item.discountType ?? null,
                discountValue: item.discountValue,
            });
            const subtotal = item.sellingPrice * item.quantity - discountAmount;
            calculatedItems.push({
                productId: new mongoose_1.Types.ObjectId(item.productId),
                variantId: new mongoose_1.Types.ObjectId(item.variantId),
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
        const grossAmount = calculatedItems.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0);
        const discountTotal = calculatedItems.reduce((sum, i) => sum + i.discountAmount, 0);
        const netAmount = grossAmount - discountTotal;
        // 6. calculate payment status
        const effectivePaid = paymentMethod === "cash_on_delivery" ? 0 : paidAmount;
        const dueAmount = Math.max(netAmount - effectivePaid, 0);
        const changeAmount = Math.max(effectivePaid - netAmount, 0);
        const paymentStatus = effectivePaid <= 0
            ? "due"
            : effectivePaid >= netAmount
                ? "paid"
                : "partial";
        // 7. resolve or create customer
        const customerId = await resolveCustomer(companyObjectId, netAmount, effectivePaid, session, customerName, customerPhone, customer_id);
        // 8. deduct stock for each variant
        for (const item of calculatedItems) {
            await product_variant_schema_1.default.updateOne({
                _id: item.variantId,
                sellerId: companyObjectId,
            }, { $inc: { stock: -item.quantity } }, { session });
        }
        // 9. generate sale code
        const saleCode = await (0, generateSaleCode_1.generateSaleCode)(sellerId);
        // 10. create sale
        const [sale] = await posSell_schema_1.default.create([
            {
                sellerId: companyObjectId,
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
        ], { session });
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