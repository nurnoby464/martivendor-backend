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
exports.getMyInventory = exports.editProductVariant = exports.getAllProductWithVariant = exports.deleteVariant = exports.updateVariant = exports.getVariantById = exports.getVariants = exports.createVariant = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const product_schema_1 = __importDefault(require("../product/product.schema"));
const product_variant_schema_1 = __importDefault(require("../product-variant/product-variant.schema"));
const auditLogger_1 = require("../../utils/auditLogger");
const audit_interface_1 = require("../audit/audit.interface");
const sanitizeData_1 = require("../../utils/sanitizeData");
const useSkip_1 = require("../../utils/useSkip");
const appError_1 = require("../../middlewares/appError");
const createVariant = async (payload, req) => {
    const { productId, sellerId, ...rest } = payload;
    // product must exist, belong to company, and have hasVariants = true
    const product = await product_schema_1.default.findOne({
        _id: productId,
        sellerId,
        isActive: true,
    }).lean();
    if (!product)
        throw new appError_1.AppError("Product not found", 404);
    if (!product.hasVariants) {
        throw new appError_1.AppError("This product does not support variants. Enable hasVariants first.", 400);
    }
    // unique sku
    //   await assertUniqVariantSku(sku, sellerId);
    // Block duplicate attribute combination for this product
    const duplicate = await product_variant_schema_1.default.findOne({
        productId,
        isActive: true,
        $and: rest.attributes.map((a) => ({
            attributes: { $elemMatch: { key: a.key, value: a.value } },
        })),
    }).lean();
    if (duplicate)
        throw new appError_1.AppError("A variant with the same attribute combination already exists", 409);
    const variant = await product_variant_schema_1.default.create((0, sanitizeData_1.sanitizeData)({
        ...rest,
        productId: new mongoose_1.default.Types.ObjectId(productId),
        sellerId,
    }));
    (0, auditLogger_1.auditLog)({
        req,
        action: audit_interface_1.AUDIT_ACTIONS.VARIANT_CREATED,
        targetModel: "ProductVariant",
        targetId: variant._id,
        after: {
            productId: variant.productId,
        },
    });
    return variant;
};
exports.createVariant = createVariant;
// ─── Get variants of a product ────────────────────────────
const getVariants = async (payload) => {
    const product = await product_schema_1.default.findOne({
        _id: payload.productId,
        sellerId: payload.sellerId,
    }).lean();
    if (!product)
        throw new appError_1.AppError("Product not found", 404);
    const variants = await product_variant_schema_1.default.find({
        productId: payload.productId,
    })
        .sort({ createdAt: 1 })
        .lean();
    return variants;
};
exports.getVariants = getVariants;
const getVariantById = async (variantId, sellerId) => {
    const variant = await product_variant_schema_1.default.findOne({
        _id: variantId,
        sellerId,
    }).lean();
    if (!variant)
        throw new appError_1.AppError("Variant not found", 404);
    return variant;
};
exports.getVariantById = getVariantById;
// ─── Update variant ───────────────────────────────────────
const updateVariant = async (variantId, sellerId, payload, req) => {
    const variant = await product_variant_schema_1.default.findOne({
        _id: variantId,
        sellerId,
    });
    if (!variant)
        throw new appError_1.AppError("Variant not found", 404);
    const before = {
        productId: variant.productId,
    };
    const updated = await product_variant_schema_1.default.findOneAndUpdate({ _id: variantId, sellerId }, { $set: (0, sanitizeData_1.sanitizeData)(payload) }, { new: true, runValidators: true }).lean();
    if (!updated)
        throw new appError_1.AppError("Variant not found", 404);
    (0, auditLogger_1.auditLog)({
        req,
        action: audit_interface_1.AUDIT_ACTIONS.VARIANT_UPDATED,
        targetModel: "ProductVariant",
        targetId: variant._id,
        before,
        after: {
            productId: updated.productId,
        },
    });
    return updated;
};
exports.updateVariant = updateVariant;
// ─── Delete variant ───────────────────────────────────────
const deleteVariant = async (payload) => {
    const { id, productId, sellerId, req } = payload;
    const variant = await product_variant_schema_1.default.findOne({
        _id: id,
        productId,
        sellerId,
    });
    if (!variant)
        throw new appError_1.AppError("Variant not found", 404);
    variant.isActive = false;
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
    const sellerId = req.user.sellerId;
    if (!sellerId) {
        throw new appError_1.AppError("Company is required", 400);
    }
    const filter = {
        sellerId: new mongoose_1.Types.ObjectId(sellerId),
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
                $and: [{ $lte: ["$stock", "$lowStockAlert"] }, { $gte: ["$stock", 1] }],
            };
        }
    }
    const [result] = await product_variant_schema_1.default.aggregate([
        { $match: { sellerId: new mongoose_1.Types.ObjectId(sellerId) } },
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
                                                { $lte: ["$stock", "$lowStockAlert"] },
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
                            localField: "productId",
                            foreignField: "_id",
                            as: "_product",
                            pipeline: [
                                {
                                    $project: {
                                        name: 1,
                                        categoryId: 1,
                                        specification: 1,
                                        description: 1,
                                        discount: 1,
                                        hasDiscount: 1,
                                        tags: 1,
                                    },
                                },
                            ], // ← also grab category_id
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
                            specification: { $arrayElemAt: ["$_product.specification", 0] },
                            categoryId: { $arrayElemAt: ["$_product.categoryId", 0] }, // ← flatten it out
                            description: { $arrayElemAt: ["$_product.description", 0] },
                            hasDiscount: { $arrayElemAt: ["$_product.hasDiscount", 0] },
                            tags: { $arrayElemAt: ["$_product.tags", 0] },
                            discount: { $arrayElemAt: ["$_product.discount", 0] },
                        },
                    },
                    {
                        $lookup: {
                            from: "categories",
                            localField: "categoryId",
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
                            productId: 1,
                            sellerId: 1,
                            categoryId: 1, // ← add
                            categoryName: 1, // ← add
                            categorySlug: 1, // ← add
                            categoryPath: 1, // ["Men", "Shirt"]
                            categoryBreadcrumb: 1,
                            sku: 1,
                            image: 1,
                            buyingPrice: 1,
                            sellingPrice: 1,
                            profit: 1,
                            profit_margin: 1,
                            stock: 1,
                            lowStockAlert: 1,
                            isActive: 1,
                            productName: 1,
                            color: 1,
                            size: 1,
                            specification: 1,
                            description: 1,
                            discount: 1,
                            hasDiscount: 1,
                            tags: 1,
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
    const sellerId = req.user.sellerId;
    const userId = req.user._id;
    if (!sellerId) {
        throw new appError_1.AppError("sellerId not found", 400);
    }
    const { variantId, sellingPrice, newImage, previousImage, alertStock } = input;
    const existing = await product_variant_schema_1.default.findOne({
        sellerId: sellerId,
        _id: new mongoose_1.Types.ObjectId(variantId),
    });
    if (!existing) {
        throw new appError_1.AppError("Product variant not found");
    }
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const updateVariant = await product_variant_schema_1.default.findOneAndUpdate({
            sellerId: sellerId,
            _id: existing._id,
        }, {
            $set: {
                sellingPrice: sellingPrice ? sellingPrice : existing.sellingPrice,
                lowStockAlert: alertStock ? alertStock : existing.lowStockAlert,
                image: newImage ? newImage : existing.image,
            },
        }, { session, returnDocument: "after", runValidators: true });
        if (!updateVariant) {
            throw new appError_1.AppError("Failed to edit product variant");
        }
        const editProduct = await product_schema_1.default.findOneAndUpdate({ sellerId: sellerId, _id: existing.productId }, [
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
const getMyInventory = async (sellerId, query) => {
    const { search, sortBy, sortOrder, page, limit } = query;
    console.log("sellerId", sellerId);
    const SORT_FIELD_MAP = {
        name: "name",
        price: "displayPriceMin",
        stock: "totalStock",
        createdAt: "createdAt",
        updatedAt: "updatedAt",
    };
    const sortField = SORT_FIELD_MAP[sortBy ?? "createdAt"] ?? "createdAt";
    const filter = {
        sellerId: new mongoose_1.default.Types.ObjectId(sellerId),
    };
    console.log("filter", filter);
    const result = await product_variant_schema_1.default.aggregate([
        { $match: filter },
        {
            $group: {
                _id: "$productId",
                variants: { $push: "$$ROOT" },
                totalStock: { $sum: "$stock" },
                variantCount: { $sum: 1 },
            },
        },
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                pipeline: [
                    {
                        $lookup: {
                            from: "categories",
                            localField: "categoryId",
                            foreignField: "_id",
                            pipeline: [
                                { $project: { name: 1, slug: 1, image: 1, slugPath: 1 } },
                            ],
                            as: "category",
                        },
                    },
                    {
                        $set: {
                            category: { $arrayElemAt: ["$category", 0] },
                            variants: "$variants",
                        },
                    },
                    {
                        $project: {
                            name: 1,
                            slug: 1,
                            slugPath: 1,
                            description: 1,
                            // categoryId: 1,
                            category: 1,
                            productType: 1,
                            specification: 1,
                            images: 1,
                            isActive: 1,
                            displayPriceMin: 1,
                            displayPriceMax: 1,
                            asin: 1,
                            sku: 1,
                            showOnHomepage: 1,
                            tags: 1,
                            hasDiscount: 1,
                            discount: 1,
                            variants: 1,
                        },
                    },
                ],
                as: "product",
            },
        },
        {
            $set: {
                product: {
                    $mergeObjects: [
                        { $arrayElemAt: ["$product", 0] },
                        {
                            variants: "$variants",
                            totalStock: "$totalStock",
                            variantCount: "$variantCount",
                        },
                    ],
                },
            },
        },
        // {
        //   $project: {
        //     _id: 0,
        //     product: 1,
        //   },
        // },
        {
            $replaceRoot: { newRoot: "$product" },
        },
        ...(search
            ? [
                {
                    $match: {
                        $or: [
                            { name: { $regex: search.trim(), $options: "i" } },
                            { slug: { $regex: search.trim(), $options: "i" } },
                            { "category.name": { $regex: search.trim(), $options: "i" } },
                            { "category.slug": { $regex: search.trim(), $options: "i" } },
                        ],
                    },
                },
            ]
            : []),
        {
            $facet: {
                data: [
                    { $sort: { [sortField]: sortOrder } },
                    { $skip: (0, useSkip_1.useSkip)({ page, limit }) },
                    { $limit: limit },
                ],
                totalCount: [{ $count: "count" }],
            },
        },
        {
            $set: {
                totalCount: {
                    $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0],
                },
            },
        },
    ]);
    const { data, totalCount } = result[0] ?? { data: [], totalCount: 0 };
    return { data, totalCount, page, limit };
};
exports.getMyInventory = getMyInventory;
//# sourceMappingURL=product-variant.service.js.map