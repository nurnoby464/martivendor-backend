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
exports.getProductForCart = exports.getProductBySlug = exports.getSuggestions = exports.searchCategories = exports.getAllCategories = exports.getProductFilterCategories = exports.getProducts = exports.getPublicMergedCategories = void 0;
const product_schema_1 = __importDefault(require("../product/product.schema"));
const mongoose_1 = __importStar(require("mongoose"));
const product_variant_schema_1 = __importDefault(require("../product-variant/product-variant.schema"));
const category_schema_1 = __importDefault(require("../category/category.schema"));
const appError_1 = require("../../middlewares/appError");
const seller_schema_1 = require("../seller/seller.schema");
const helper_1 = require("../../utils/helper");
// reuseable merge stage — dedupes any set of category docs by slugPath
const mergeBySlugPath = (matchStage) => [
    { $match: matchStage },
    {
        $group: {
            _id: "$slugPath",
            name: { $first: "$name" },
            depth: { $first: "$depth" },
            images: { $push: "$image" },
            sellerIds: { $addToSet: "$sellerId" },
        },
    },
    {
        $addFields: {
            slugPath: "$_id",
            slug: { $arrayElemAt: ["$_id", -1] },
            image: {
                $first: {
                    $filter: { input: "$images", cond: { $ne: ["$$this", null] } },
                },
            },
            sellerCount: { $size: "$sellerIds" },
        },
    },
    { $project: { images: 0, sellerIds: 0, _id: 0 } },
];
const getPublicMergedCategories = async (payload) => {
    const { page, limit } = payload;
    const skip = (page - 1) * limit;
    // 1. merged root categories, paginated
    const rootPipeline = [
        ...mergeBySlugPath({ isActive: true, depth: 0 }),
        { $sort: { sellerCount: -1, name: 1 } },
        {
            $facet: {
                data: [{ $skip: skip }, { $limit: limit }],
                meta: [{ $count: "total" }],
            },
        },
    ];
    const [rootResult] = await category_schema_1.default.aggregate(rootPipeline);
    const roots = rootResult?.data ?? [];
    const total = rootResult?.meta?.[0]?.total ?? 0;
    if (!roots.length)
        return { categories: [], total, page, limit };
    const rootSlugs = roots.map((r) => r.slug);
    // 2. merged descendants of ONLY those roots — any seller, matched
    //    by first element of slugPath (their root slug)
    const descendantPipeline = [
        ...mergeBySlugPath({
            isActive: true,
            depth: { $gt: 0 },
            "slugPath.0": { $in: rootSlugs },
        }),
        { $sort: { depth: 1, name: 1 } },
    ];
    const descendants = await category_schema_1.default.aggregate(descendantPipeline);
    const allNodes = [...roots, ...descendants].map((c) => ({
        slugPath: c.slugPath,
        slug: c.slug,
        name: c.name,
        depth: c.depth,
        parentSlugPath: c.slugPath.length > 1 ? c.slugPath.slice(0, -1) : null,
        image: c.image ?? null,
        sellerCount: c.sellerCount,
        hasChildren: false,
    }));
    // hasChildren — in-memory, one pass, same trick as searchCategories
    const parentKeySet = new Set(allNodes
        .filter((n) => n.parentSlugPath)
        .map((n) => n.parentSlugPath.join("/")));
    allNodes.forEach((n) => {
        n.hasChildren = parentKeySet.has(n.slugPath.join("/"));
    });
    // depth-first order, matching the flat-array contract your
    // CategoryTree/buildCategoryTree already expects on the dashboard
    const byParentKey = new Map();
    allNodes.forEach((n) => {
        if (!n.parentSlugPath)
            return;
        const key = n.parentSlugPath.join("/");
        if (!byParentKey.has(key))
            byParentKey.set(key, []);
        byParentKey.get(key).push(n);
    });
    const nodeByKey = new Map(allNodes.map((n) => [n.slugPath.join("/"), n]));
    const sorted = [];
    const visit = (node) => {
        sorted.push(node);
        (byParentKey.get(node.slugPath.join("/")) ?? [])
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach(visit);
    };
    roots.forEach((r) => visit(nodeByKey.get(r.slugPath.join("/"))));
    return { categories: sorted, total, page, limit };
};
exports.getPublicMergedCategories = getPublicMergedCategories;
const getProducts = async (payload) => {
    const { page, limit, search, categoryId, 
    // vendor_id,
    hasVariants, isActive, lowStock, sortBy, sortOrder, productType, tags, discount, hasDiscount, categorySlug, } = payload;
    const baseFilter = {};
    if (isActive !== undefined)
        baseFilter.isActive = isActive;
    if (hasVariants !== undefined)
        baseFilter.hasVariants = hasVariants;
    if (lowStock === "true") {
        baseFilter.$expr = { $lte: ["$stock", "$lowStockAlert"] };
    }
    if (productType)
        baseFilter.productType = productType;
    if (discount)
        baseFilter.discount = discount;
    if (hasDiscount)
        baseFilter.hasDiscount = hasDiscount;
    if (tags && tags?.length > 0)
        baseFilter.tags = { $in: tags };
    if (search) {
        baseFilter.$or = [
            { name: { $regex: search, $options: "i" } },
            { sku: { $regex: search, $options: "i" } },
        ];
    }
    const filter = {
        ...baseFilter,
        showOnHomepage: true,
    };
    if (categorySlug) {
        const slugPathArr = categorySlug
            .split("/")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
        const matchedCategories = await category_schema_1.default.find({
            slugPath: { $in: slugPathArr },
            isActive: true,
        })
            .select("_id")
            .lean();
        if (!matchedCategories || matchedCategories.length === 0) {
            throw new appError_1.AppError("Category not found", 404);
        }
        const matchedIds = matchedCategories.map((c) => c._id);
        // Also pull in descendant categories (so "electronics" shows
        // products from "mobile-phones", "laptops", etc. too)
        const descendantCategories = await category_schema_1.default.find({
            path: { $in: matchedIds },
            isActive: true,
        })
            .select("_id")
            .lean();
        const allCategoryIds = [
            ...matchedIds,
            ...descendantCategories.map((c) => c._id),
        ];
        filter.categoryId = { $in: allCategoryIds };
    }
    if (categoryId) {
        const allDescendantCategories = await category_schema_1.default.find({
            path: new mongoose_1.default.Types.ObjectId(categoryId), // ✅ array contains match
            isActive: true,
        }).lean();
        const allCategoryIds = [
            new mongoose_1.default.Types.ObjectId(categoryId),
            ...allDescendantCategories.map((c) => c._id),
        ];
        filter.categoryId = { $in: allCategoryIds };
    }
    const sortDir = sortOrder === "asc" ? 1 : -1;
    const [products, total, categories] = await Promise.all([
        // Product.find(filter)
        //   .populate("categoryId", "name slug depth slugPath")
        //   .populate("sellerId", "name")
        //   .sort({ [sortBy]: sortDir })
        //   .skip((page - 1) * limit)
        //   .limit(limit)
        //   .select(
        //     "sellerId categoryId name slug description productType specification images sellingPrice discount stock hasVariants displayPriceMin displayPriceMax totalStock hasDiscount tags nameLower sku asin showOnHomepage",
        //   )
        //   .lean(),
        product_schema_1.default.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                slug: 1,
                                depth: 1,
                                slugPath: 1,
                            },
                        },
                    ],
                    as: "categoryId",
                },
            },
            {
                $unwind: "$categoryId",
            },
            {
                $lookup: {
                    from: "sellers",
                    localField: "sellerId",
                    foreignField: "_id",
                    pipeline: [{ $project: { name: 1 } }],
                    as: "sellerId",
                },
            },
            {
                $unwind: "$sellerId",
            },
            // {
            //   $addFields: {
            //     discountAmount: {
            //       $cond: {
            //         if: { $gt: ["$discount", 0] },
            //         then: {
            //           $round: [
            //             {
            //               $divide: [
            //                 { $multiply: ["$sellingPrice", "$discount"] },
            //                 100,
            //               ],
            //             },
            //             2,
            //           ],
            //         },
            //         else: 0,
            //       },
            //     },
            //   },
            // },
            // {
            //   $addFields: {
            //     finalPrice: { $subtract: ["$sellingPrice", "$discountAmount"] },
            //   },
            // },
            {
                $addFields: {
                    maxDiscountAmount: {
                        $cond: {
                            if: { $gt: ["$discount", 0] },
                            then: {
                                $round: [
                                    {
                                        $divide: [
                                            { $multiply: ["$displayPriceMax", "$discount"] },
                                            100,
                                        ],
                                    },
                                    2,
                                ],
                            },
                            else: 0,
                        },
                    },
                },
            },
            {
                $addFields: {
                    finalMaxPrice: {
                        $subtract: ["$displayPriceMax", "$maxDiscountAmount"],
                    },
                },
            },
            { $sort: { [sortBy]: sortDir } },
            // ,{$skip:{(page - 1) * limit}}
            { $limit: limit },
            {
                $project: {
                    sellerId: 1,
                    categoryId: 1,
                    name: 1,
                    slug: 1,
                    description: 1,
                    productType: 1,
                    specification: 1,
                    images: 1,
                    sellingPrice: 1,
                    discount: 1,
                    stock: 1,
                    hasVariants: 1,
                    displayPriceMin: 1,
                    displayPriceMax: 1,
                    totalStock: 1,
                    hasDiscount: 1,
                    tags: 1,
                    nameLower: 1,
                    sku: 1,
                    asin: 1,
                    showOnHomepage: 1,
                    anotherCategory: 1,
                    finalMaxPrice: 1,
                    maxDiscountAmount: 1,
                },
            },
        ]),
        product_schema_1.default.countDocuments(filter),
        product_schema_1.default.aggregate([
            {
                $match: baseFilter,
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "category",
                },
            },
            { $unwind: "$category" },
            { $match: { "category.isActive": true } },
            {
                $group: {
                    _id: "$category.slug",
                    categoryId: { $first: "$category._id" },
                    name: { $first: "$category.name" },
                    slugPath: { $first: "$category.slugPath" },
                    depth: { $first: "$category.depth" },
                    productCount: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: "$categoryId",
                    name: 1,
                    slug: "$_id",
                    slugPath: 1,
                    depth: 1,
                    productCount: 1,
                },
            },
            { $sort: { productCount: -1, name: 1 } },
        ]),
    ]);
    // console.log("products", products);
    // console.log("demo", demo);
    return { products, total, categories };
};
exports.getProducts = getProducts;
const getProductFilterCategories = async (payload) => {
    const { page, limit, search, categoryId, 
    // vendor_id,
    hasVariants, isActive, lowStock, sortBy, sortOrder, productType, tags, discount, hasDiscount, categorySlug, } = payload;
    const baseFilter = {};
    if (isActive !== undefined)
        baseFilter.isActive = isActive;
    if (hasVariants !== undefined)
        baseFilter.hasVariants = hasVariants;
    if (lowStock === "true") {
        baseFilter.$expr = { $lte: ["$stock", "$lowStockAlert"] };
    }
    if (productType)
        baseFilter.productType = productType;
    if (discount)
        baseFilter.discount = discount;
    if (hasDiscount)
        baseFilter.hasDiscount = hasDiscount;
    if (tags && tags?.length > 0)
        baseFilter.tags = { $in: tags };
    if (search) {
        baseFilter.$or = [
            { name: { $regex: search, $options: "i" } },
            { sku: { $regex: search, $options: "i" } },
        ];
    }
    const filter = { ...baseFilter };
    if (categorySlug) {
        const slugPathArr = categorySlug
            .split("/")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
        const matchedCategories = await category_schema_1.default.find({
            slugPath: { $in: slugPathArr },
            isActive: true,
        })
            .select("_id")
            .lean();
        if (!matchedCategories || matchedCategories.length === 0) {
            throw new appError_1.AppError("Category not found", 404);
        }
        const matchedIds = matchedCategories.map((c) => c._id);
        // Also pull in descendant categories (so "electronics" shows
        // products from "mobile-phones", "laptops", etc. too)
        const descendantCategories = await category_schema_1.default.find({
            path: { $in: matchedIds },
            isActive: true,
        })
            .select("_id")
            .lean();
        const allCategoryIds = [
            ...matchedIds,
            ...descendantCategories.map((c) => c._id),
        ];
        filter.categoryId = { $in: allCategoryIds };
    }
    if (categoryId) {
        const allDescendantCategories = await category_schema_1.default.find({
            path: new mongoose_1.default.Types.ObjectId(categoryId), // ✅ array contains match
            isActive: true,
        }).lean();
        const allCategoryIds = [
            new mongoose_1.default.Types.ObjectId(categoryId),
            ...allDescendantCategories.map((c) => c._id),
        ];
        filter.categoryId = { $in: allCategoryIds };
    }
    const sortDir = sortOrder === "asc" ? 1 : -1;
    const categories = await product_schema_1.default.aggregate([
        {
            $match: baseFilter,
        },
        {
            $lookup: {
                from: "categories",
                localField: "categoryId",
                foreignField: "_id",
                as: "category",
            },
        },
        { $unwind: "$category" },
        { $match: { "category.isActive": true } },
        {
            $group: {
                _id: "$category.slug",
                categoryId: { $first: "$category._id" },
                name: { $first: "$category.name" },
                slugPath: { $first: "$category.slugPath" },
                depth: { $first: "$category.depth" },
                productCount: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: "$categoryId",
                name: 1,
                slug: "$_id",
                slugPath: 1,
                depth: 1,
                productCount: 1,
            },
        },
        { $sort: { [sortBy]: sortDir } },
    ]);
    return categories;
};
exports.getProductFilterCategories = getProductFilterCategories;
const getAllCategories = async (req) => {
    const categories = await category_schema_1.default.find({}).sort({ createdAt: -1 }).lean();
    return categories;
};
exports.getAllCategories = getAllCategories;
const searchCategories = async (payload) => {
    const { search, skip, limit } = payload;
    const baseFilter = {
        isActive: true,
    };
    let matched;
    let total;
    if (search?.trim()) {
        // 1. find the root match
        const root = await category_schema_1.default.findOne({
            ...baseFilter,
            $or: [
                { name: { $regex: `^${search.trim()}$`, $options: "i" } },
                { slug: { $regex: `^${search.trim()}$`, $options: "i" } },
            ],
        }).lean();
        if (!root)
            return { categories: [], total: 0 };
        // 2. fetch root + all descendants
        const descendantFilter = {
            isActive: true,
            $or: [{ _id: root._id }, { path: root._id }],
        };
        [matched, total] = await Promise.all([
            category_schema_1.default.find(descendantFilter)
                .sort({ depth: 1, name: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            category_schema_1.default.countDocuments(descendantFilter),
        ]);
    }
    else {
        [matched, total] = await Promise.all([
            category_schema_1.default.find(baseFilter)
                .sort({ depth: 1, name: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            category_schema_1.default.countDocuments(baseFilter),
        ]);
    }
    if (!matched.length)
        return { categories: [], total };
    // collect all ancestor IDs across all matched — one flat set
    const allAncestorIds = new Set();
    matched.forEach((c) => {
        c.path?.forEach((id) => allAncestorIds.add(id.toHexString()));
    });
    // fetch all ancestors in ONE query
    const ancestorDocs = await category_schema_1.default.find({
        _id: { $in: Array.from(allAncestorIds) },
    })
        .select("_id name depth")
        .lean();
    const ancestorMap = new Map();
    ancestorDocs.forEach((a) => ancestorMap.set(a._id.toHexString(), a));
    // check hasChildren for all matched in ONE query
    const childDocs = await category_schema_1.default.find({
        isActive: true,
        parentId: { $in: matched.map((c) => c._id) },
    })
        .select("parentId")
        .lean();
    const hasChildrenSet = new Set(childDocs.map((c) => c.parentId.toHexString()));
    // build response — pure in-memory, no more DB calls
    const categories = matched.map((c) => {
        const ancestorList = (c.path ?? [])
            .map((id) => {
            const a = ancestorMap.get(id.toHexString());
            return a ? { _id: a._id, name: a.name, depth: a.depth } : null;
        })
            .filter(Boolean);
        const parent = c.parentId
            ? ancestorMap.get(c.parentId.toHexString())
            : null;
        const fullPath = [...ancestorList.map((a) => a.name), c.name].join(" > ");
        return {
            _id: c._id,
            name: c.name,
            slug: c.slug,
            fullPath,
            parentId: c.parentId ?? null,
            parentName: parent?.name ?? null,
            ancestors: ancestorList,
            depth: c.depth,
            hasChildren: hasChildrenSet.has(c._id.toHexString()),
            image: c.image ?? null,
        };
    });
    return { categories, total };
};
exports.searchCategories = searchCategories;
const getSuggestions = async (search) => {
    const trimmed = search?.trim();
    console.log("trimmed", trimmed);
    const prefix = `^${(0, helper_1.escapeRegex)(trimmed.toLowerCase())}`;
    console.log("prefix", prefix);
    if (!trimmed)
        throw new appError_1.AppError("Search value is required", 400);
    const filter = { nameLower: { $regex: prefix }, isActive: true };
    const [products, categories, sellers] = await Promise.all([
        product_schema_1.default.aggregate([
            { $match: { isActive: true, nameLower: { $regex: prefix } } },
            { $sort: { createdAt: 1 } },
            {
                $group: {
                    _id: "$slug",
                    name: { $first: "$name" },
                    // image: { $first: { $arrayElemAt: ["$images", 0] } },
                    // minPrice: { $min: "$displayPriceMin" },
                    // maxPrice: { $min: "$displayPriceMax" },
                    // productType: { $addToSet: "$productType" },
                    // sellerCount: { $sum: 1 },
                    // productIds: { $push: "$_id" },
                },
            },
            { $limit: 20 },
            {
                $project: {
                    _id: 0,
                    slug: "$_id",
                    name: 1,
                    // image: 1,
                    // minPrice: 1,
                    // maxPrice: 1,
                    // productTypes: 1,
                    // sellerCount: 1,
                },
            },
        ]),
        category_schema_1.default.aggregate([
            { $match: { isActive: true, nameLower: { $regex: prefix } } },
            {
                $group: {
                    _id: "$slug",
                    name: { $first: "$name" },
                    // image: { $first: "$image" },
                },
            },
            {
                $addFields: {
                    _score: {
                        $switch: {
                            branches: [
                                // 1. Exact match (case-insensitive) — highest priority
                                {
                                    case: { $eq: [{ $toLower: "$name" }, trimmed.toLowerCase()] },
                                    then: 3,
                                },
                                // 2. Name starts with the query — "Phone Mount" beats "Mobile Phones"
                                {
                                    case: {
                                        $eq: [
                                            {
                                                $indexOfCP: [
                                                    { $toLower: "$name" },
                                                    trimmed.toLowerCase(),
                                                ],
                                            },
                                            0,
                                        ],
                                    },
                                    then: 2,
                                },
                            ],
                            // 3. Query appears somewhere in the middle — lowest priority
                            default: 1,
                        },
                    },
                },
            },
            { $sort: { _score: -1, name: 1 } }, // score first, alphabetical as tiebreaker
            { $limit: 20 },
            {
                $project: {
                    _id: 0,
                    name: 1,
                    //  image: 1,
                    slug: "$_id",
                },
            }, // drop _score, don't leak it to client
        ]),
        seller_schema_1.Seller.find({ isActive: true, nameLower: { $regex: prefix } })
            .select("name slug  -_id")
            .lean(),
    ]);
    return { categories, products, sellers };
};
exports.getSuggestions = getSuggestions;
const getProductBySlug = async (payload) => {
    const asin = (0, helper_1.extractAsin)(payload.slug);
    const filter = asin !== null && asin !== undefined && asin !== ""
        ? { asin: asin }
        : { slug: payload.slug };
    const product = await product_schema_1.default.findOne(filter)
        .populate("categoryId", "name slug path depth")
        // .populate("vendor_id", "name phone email")
        .populate("createdBy", "name email")
        .select("categoryId name slug description productType specification images tags createdBy asin sku nameLower createdAt updatedAt hasVariants")
        .lean();
    if (!product)
        throw new appError_1.AppError("Product not found", 404);
    // attach variants if hasVariants
    let variants = [];
    if (product.hasVariants) {
        // variants = await ProductVariant.find({
        //   // sellerId: payload.sellerId,
        //   productId: product._id,
        //   isActive: true,
        // }).lean();
        variants = await product_variant_schema_1.default.aggregate([
            { $match: { productId: product._id, isActive: true } },
            {
                $lookup: {
                    from: "sellers",
                    localField: "sellerId",
                    foreignField: "_id",
                    pipeline: [{ $project: { name: 1 } }],
                    as: "seller",
                },
            },
            { $unwind: "$seller" },
            {
                $addFields: {
                    discountAmount: {
                        $cond: {
                            if: { $gt: ["$discountValue", 0] },
                            then: {
                                $round: [
                                    {
                                        $cond: {
                                            if: { $eq: ["$discountType", "percentage"] },
                                            then: {
                                                $divide: [
                                                    {
                                                        $multiply: ["$sellingPrice", "$discountValue"],
                                                    },
                                                    100,
                                                ],
                                            },
                                            else: "$discountValue",
                                        },
                                    },
                                    2,
                                ],
                            },
                            else: 0,
                        },
                    },
                },
            },
            {
                $addFields: {
                    finalPrice: {
                        $subtract: ["$sellingPrice", "$discountAmount"],
                    },
                },
            },
            {
                $project: {
                    productId: 1,
                    seller: 1,
                    attributes: 1,
                    sku: 1,
                    image: 1,
                    sellingPrice: 1,
                    stock: 1,
                    discountType: 1,
                    discountValue: 1,
                    discountAmount: 1,
                    finalPrice: 1,
                },
            },
        ]);
    }
    return { product, variants };
};
exports.getProductBySlug = getProductBySlug;
const getProductForCart = async (payload) => {
    const { productId, variantId } = payload;
    const filter = {
        productId: new mongoose_1.Types.ObjectId(productId),
        isActive: true,
        stock: { $gt: 0 },
    };
    if (variantId)
        filter._id = new mongoose_1.Types.ObjectId(variantId);
    const [product] = await product_variant_schema_1.default.aggregate([
        { $match: filter },
        {
            $lookup: {
                from: "products",
                localField: "productId",
                foreignField: "_id",
                pipeline: [
                    {
                        $project: {
                            name: 1,
                            slug: 1,
                        },
                    },
                ],
                as: "productId",
            },
        },
        {
            $unwind: "$productId"
        },
        {
            $lookup: {
                from: "sellers",
                localField: "sellerId",
                foreignField: "_id",
                pipeline: [
                    {
                        $project: {
                            name: 1,
                        },
                    },
                ],
                as: "sellerId",
            },
        },
        {
            $unwind: "$sellerId"
        },
        {
            $addFields: {
                discountAmount: {
                    $switch: {
                        branches: [
                            {
                                case: { $lte: ["$discountValue", 0] },
                                then: 0,
                            },
                            {
                                case: { $eq: ["$discountType", "percentage"] },
                                then: {
                                    $round: [
                                        {
                                            $divide: [
                                                {
                                                    $multiply: ["$sellingPrice", "$discountValue"],
                                                },
                                                100,
                                            ],
                                        },
                                        2,
                                    ],
                                },
                            },
                        ],
                        default: "$discountValue",
                    },
                },
            },
        },
        {
            $addFields: {
                finalPrice: {
                    $max: [{ $subtract: ["$sellingPrice", "$discountAmount"] }, 0],
                }
            }
        },
        {
            $project: {
                attributes: 1,
                discountType: 1,
                finalPrice: 1,
                discountAmount: 1,
                discountValue: 1,
                image: 1,
                productId: 1,
                sellerId: 1,
                sellingPrice: 1,
                sku: 1,
                stock: 1,
            },
        },
    ]);
    // const product = await ProductVariant.findOne(filter)
    //   .populate(
    //     "productId",
    //     "name slug description images specification productType",
    //   )
    //   .lean();
    if (!product)
        throw new appError_1.AppError("Variant not found", 404);
    return product;
};
exports.getProductForCart = getProductForCart;
//# sourceMappingURL=public.service.js.map