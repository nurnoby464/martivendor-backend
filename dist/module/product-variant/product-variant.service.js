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
exports.editProductVariant = exports.getAllProductWithVariant = exports.deleteVariant = exports.updateVariant = exports.getVariantById = exports.getVariants = exports.createVariant = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const product_schema_1 = __importDefault(require("../product/product.schema"));
const product_variant_schema_1 = __importDefault(require("../product-variant/product-variant.schema"));
const auditLogger_1 = require("../../utils/auditLogger");
const audit_interface_1 = require("../audit/audit.interface");
const sanitizeData_1 = require("../../utils/sanitizeData");
const useSkip_1 = require("../../utils/useSkip");
const appError_1 = require("../../middlewares/appError");
const createVariant = async (payload, req) => {
    const { product_id, company_id, ...rest } = payload;
    // product must exist, belong to company, and have has_variants = true
    const product = await product_schema_1.default.findOne({
        _id: product_id,
        company_id,
        is_active: true,
    }).lean();
    if (!product)
        throw new appError_1.AppError("Product not found", 404);
    if (!product.has_variants) {
        throw new appError_1.AppError("This product does not support variants. Enable has_variants first.", 400);
    }
    // unique sku
    //   await assertUniqVariantSku(sku, company_id);
    // Block duplicate attribute combination for this product
    const duplicate = await product_variant_schema_1.default.findOne({
        product_id,
        is_active: true,
        $and: rest.attributes.map((a) => ({
            attributes: { $elemMatch: { key: a.key, value: a.value } },
        })),
    }).lean();
    if (duplicate)
        throw new appError_1.AppError("A variant with the same attribute combination already exists", 409);
    const variant = await product_variant_schema_1.default.create((0, sanitizeData_1.sanitizeData)({
        ...rest,
        product_id: new mongoose_1.default.Types.ObjectId(product_id),
        company_id,
    }));
    (0, auditLogger_1.auditLog)({
        req,
        action: audit_interface_1.AUDIT_ACTIONS.VARIANT_CREATED,
        targetModel: "ProductVariant",
        targetId: variant._id,
        after: {
            product_id: variant.product_id,
        },
    });
    return variant;
};
exports.createVariant = createVariant;
// ─── Get variants of a product ────────────────────────────
const getVariants = async (payload) => {
    const product = await product_schema_1.default.findOne({
        _id: payload.product_id,
        company_id: payload.company_id,
    }).lean();
    if (!product)
        throw new appError_1.AppError("Product not found", 404);
    const variants = await product_variant_schema_1.default.find({
        product_id: payload.product_id,
    })
        .sort({ createdAt: 1 })
        .lean();
    return variants;
};
exports.getVariants = getVariants;
const getVariantById = async (variantId, company_id) => {
    const variant = await product_variant_schema_1.default.findOne({
        _id: variantId,
        company_id,
    }).lean();
    if (!variant)
        throw new appError_1.AppError("Variant not found", 404);
    return variant;
};
exports.getVariantById = getVariantById;
// ─── Update variant ───────────────────────────────────────
const updateVariant = async (variantId, company_id, payload, req) => {
    const variant = await product_variant_schema_1.default.findOne({
        _id: variantId,
        company_id,
    });
    if (!variant)
        throw new appError_1.AppError("Variant not found", 404);
    const before = {
        product_id: variant.product_id,
    };
    const updated = await product_variant_schema_1.default.findOneAndUpdate({ _id: variantId, company_id }, { $set: (0, sanitizeData_1.sanitizeData)(payload) }, { new: true, runValidators: true }).lean();
    if (!updated)
        throw new appError_1.AppError("Variant not found", 404);
    (0, auditLogger_1.auditLog)({
        req,
        action: audit_interface_1.AUDIT_ACTIONS.VARIANT_UPDATED,
        targetModel: "ProductVariant",
        targetId: variant._id,
        before,
        after: {
            product_id: updated.product_id,
        },
    });
    return updated;
};
exports.updateVariant = updateVariant;
// ─── Delete variant ───────────────────────────────────────
const deleteVariant = async (payload) => {
    const { id, product_id, company_id, req } = payload;
    const variant = await product_variant_schema_1.default.findOne({
        _id: id,
        product_id,
        company_id,
    });
    if (!variant)
        throw new appError_1.AppError("Variant not found", 404);
    variant.is_active = false;
    await variant.save();
    (0, auditLogger_1.auditLog)({
        req,
        action: audit_interface_1.AUDIT_ACTIONS.VARIANT_DELETED,
        targetModel: "ProductVariant",
        targetId: variant._id,
    });
    return variant;
};
exports.deleteVariant = deleteVariant;
const getAllProductWithVariant = async (payload) => {
    const { req } = payload;
    const query = req.validatedQuery;
    const { page, limit, search, stock, sortBy, sortOrder } = query;
    const lowStockNumber = 3;
    const companyId = req.user.company_id;
    if (!companyId) {
        throw new appError_1.AppError("Company is required", 400);
    }
    const filter = {
        company_id: new mongoose_1.Types.ObjectId(companyId),
    };
    if (search) {
        const keywords = search.trim().split(/\s+/);
        filter.$and = keywords.map((word) => ({
            $or: [
                { sku: { $regex: word, $options: "i" } },
                { "attributes.value": { $regex: word, $options: "i" } },
            ],
        }));
    }
    if (stock && stock.trim() !== "") {
        if (stock === "outOfStock") {
            filter.stock = 0;
        }
        if (stock === "lowStock") {
            filter.stock = { $lte: 3, $gte: 1 };
        }
        if (stock === "reminderStock") {
            filter.$expr = {
                $and: [
                    { $lte: ["$stock", "$low_stock_alert"] },
                    { $gte: ["$stock", 1] },
                ],
            };
        }
    }
    const [result] = await product_variant_schema_1.default.aggregate([
        { $match: { company_id: new mongoose_1.Types.ObjectId(companyId) } },
        {
            $facet: {
                stats: [
                    {
                        $group: {
                            _id: null,
                            totalProduct: { $sum: 1 },
                            outOfStock: {
                                $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] },
                            },
                            lowStock: {
                                $sum: {
                                    $cond: [
                                        {
                                            $and: [
                                                { $gte: ["$stock", 1] },
                                                { $lte: ["$stock", lowStockNumber] },
                                            ],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },
                            reminderStock: {
                                $sum: {
                                    $cond: [
                                        {
                                            $and: [
                                                { $gte: ["$stock", 1] },
                                                { $lte: ["$stock", "$low_stock_alert"] },
                                            ],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                ],
                total: [{ $match: filter }, { $count: "count" }],
                data: [
                    { $match: filter },
                    { $sort: { [sortBy]: sortOrder } },
                    { $skip: (0, useSkip_1.useSkip)({ page, limit }) },
                    { $limit: limit },
                    {
                        $lookup: {
                            from: "products",
                            localField: "product_id",
                            foreignField: "_id",
                            as: "_product",
                            pipeline: [{ $project: { name: 1, category_id: 1 } }], // ← also grab category_id
                        },
                    },
                    {
                        $addFields: {
                            productName: {
                                $ifNull: [
                                    { $arrayElemAt: ["$_product.name", 0] },
                                    "Unknown Product",
                                ],
                            },
                            category_id: { $arrayElemAt: ["$_product.category_id", 0] }, // ← flatten it out
                        },
                    },
                    {
                        $lookup: {
                            from: "categories",
                            localField: "category_id",
                            foreignField: "_id",
                            as: "_categoryDoc",
                            pipeline: [{ $project: { name: 1, slug: 1, path: 1 } }],
                        },
                    },
                    {
                        $addFields: {
                            _categoryDoc: { $arrayElemAt: ["$_categoryDoc", 0] },
                        },
                    },
                    {
                        $addFields: {
                            // root → ... → leaf, as an array of ObjectIds
                            _categoryChain: {
                                $concatArrays: [
                                    { $ifNull: ["$_categoryDoc.path", []] },
                                    {
                                        $cond: [
                                            { $ifNull: ["$_categoryDoc._id", false] },
                                            ["$_categoryDoc._id"],
                                            [],
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: "categories",
                            localField: "_categoryChain",
                            foreignField: "_id",
                            as: "_categoryChainDocs",
                            pipeline: [{ $project: { name: 1 } }],
                        },
                    },
                    {
                        $addFields: {
                            // re-order by walking _categoryChain (the correct order), not _categoryChainDocs (arbitrary order)
                            categoryPath: {
                                $map: {
                                    input: "$_categoryChain",
                                    as: "id",
                                    in: {
                                        $let: {
                                            vars: {
                                                matched: {
                                                    $arrayElemAt: [
                                                        {
                                                            $filter: {
                                                                input: "$_categoryChainDocs",
                                                                as: "c",
                                                                cond: { $eq: ["$$c._id", "$$id"] },
                                                            },
                                                        },
                                                        0,
                                                    ],
                                                },
                                            },
                                            in: "$$matched.name",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    {
                        $addFields: {
                            categoryBreadcrumb: {
                                $reduce: {
                                    input: "$categoryPath",
                                    initialValue: "",
                                    in: {
                                        $cond: [
                                            { $eq: ["$$value", ""] },
                                            "$$this",
                                            { $concat: ["$$value", " => ", "$$this"] },
                                        ],
                                    },
                                },
                            },
                            categoryName: {
                                $ifNull: ["$_categoryDoc.name", "Uncategorized"],
                            }, // leaf name only, unchanged behavior
                            categorySlug: "$_categoryDoc.slug",
                        },
                    },
                    {
                        $addFields: {
                            color: {
                                /* unchanged */
                                $getField: {
                                    field: "value",
                                    input: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: "$attributes",
                                                    as: "a",
                                                    cond: { $eq: ["$$a.key", "color"] },
                                                },
                                            },
                                            0,
                                        ],
                                    },
                                },
                            },
                            size: {
                                /* unchanged */
                                $getField: {
                                    field: "value",
                                    input: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: "$attributes",
                                                    as: "a",
                                                    cond: { $eq: ["$$a.key", "size"] },
                                                },
                                            },
                                            0,
                                        ],
                                    },
                                },
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            product_id: 1,
                            company_id: 1,
                            category_id: 1, // ← add
                            categoryName: 1, // ← add
                            categorySlug: 1, // ← add
                            categoryPath: 1, // ["Men", "Shirt"]
                            categoryBreadcrumb: 1,
                            sku: 1,
                            image: 1,
                            buying_price: 1,
                            selling_price: 1,
                            profit: 1,
                            profit_margin: 1,
                            stock: 1,
                            low_stock_alert: 1,
                            is_active: 1,
                            productName: 1,
                            color: 1,
                            size: 1,
                        },
                    },
                ],
            },
        },
    ]);
    const stats = result.stats[0] ?? {
        totalProduct: 0,
        outOfStock: 0,
        lowStock: 0,
        reminderStock: 0,
    };
    const total = result.total[0]?.count ?? 0;
    const products = result.data;
    const data = {
        products,
        totalProduct: stats.totalProduct,
        outOfStock: stats.outOfStock,
        lowStock: stats.lowStock,
        reminderStock: stats.reminderStock,
    };
    return { data, total, query };
};
exports.getAllProductWithVariant = getAllProductWithVariant;
const editProductVariant = async (req) => {
    const input = req.body;
    const companyId = req.user.company_id;
    const userId = req.user._id;
    if (!companyId) {
        throw new appError_1.AppError("CompanyId not found", 400);
    }
    const { variantId, sellingPrice, newImage, previousImage, alertStock } = input;
    const existing = await product_variant_schema_1.default.findOne({
        company_id: companyId,
        _id: new mongoose_1.Types.ObjectId(variantId),
    });
    if (!existing) {
        throw new appError_1.AppError("Product variant not found");
    }
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const updateVariant = await product_variant_schema_1.default.findOneAndUpdate({
            company_id: companyId,
            _id: existing._id,
        }, {
            $set: {
                selling_price: sellingPrice ? sellingPrice : existing.selling_price,
                low_stock_alert: alertStock ? alertStock : existing.low_stock_alert,
                image: newImage ? newImage : existing.image,
            },
        }, { session, returnDocument: "after", runValidators: true });
        if (!updateVariant) {
            throw new appError_1.AppError("Failed to edit product variant");
        }
        const editProduct = await product_schema_1.default.findOneAndUpdate({ company_id: companyId, _id: existing.product_id }, [
            {
                $set: {
                    ...(newImage && {
                        images: {
                            $concatArrays: [
                                {
                                    $filter: {
                                        input: "$images",
                                        as: "img",
                                        cond: { $ne: ["$$img", existing.image] },
                                    },
                                },
                                [newImage],
                            ],
                        },
                    }),
                    display_price_max: {
                        $cond: {
                            if: { $gte: ["$display_price_max", sellingPrice] },
                            then: "$display_price_max",
                            else: sellingPrice,
                        },
                    },
                    display_price_min: {
                        $min: ["$display_price_min", sellingPrice],
                    },
                },
            },
        ], {
            session,
            returnDocument: "after",
            runValidators: true,
            updatePipeline: true,
        });
        await session.commitTransaction();
        return updateVariant;
    }
    catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        await session.endSession();
    }
};
exports.editProductVariant = editProductVariant;
//# sourceMappingURL=product-variant.service.js.map