"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSuggestions = exports.searchCategories = exports.getAllCategories = exports.getProductFilterCategories = exports.getProducts = exports.getPublicMergedCategories = void 0;
const product_schema_1 = __importDefault(require("../product/product.schema"));
const mongoose_1 = __importDefault(require("mongoose"));
const category_schema_1 = __importDefault(require("../category/category.schema"));
const appError_1 = require("../../middlewares/appError");
const seller_schema_1 = require("../seller/seller.schema");
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
    const [products, total, categories] = await Promise.all([
        product_schema_1.default.find(filter)
            .populate("categoryId", "name slug depth slugPath")
            // .populate("vendor_id", "name phone")
            .sort({ [sortBy]: sortDir })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
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
    if (!trimmed)
        throw new appError_1.AppError("Search value is required", 400);
    const filter = { name: { $regex: trimmed, $options: "i" }, isActive: true };
    const [products, categories, sellersDoc] = await Promise.all([
        product_schema_1.default.aggregate([
            { $match: filter },
            { $sort: { createdAt: 1 } },
            {
                $group: {
                    _id: "$slug",
                    name: { $first: "$name" },
                    image: { $first: { $arrayElemAt: ["$images", 0] } },
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
                    image: 1,
                    // minPrice: 1,
                    // maxPrice: 1,
                    // productTypes: 1,
                    // sellerCount: 1,
                },
            },
        ]),
        category_schema_1.default.aggregate([
            {
                $match: {
                    name: { $regex: trimmed, $options: "i" },
                    isActive: true,
                },
            },
            {
                $group: {
                    _id: "$slug",
                    name: { $first: "$name" },
                    image: { $first: "$image" },
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
            { $project: { _id: 0, name: 1, image: 1, slug: "$_id" } }, // drop _score, don't leak it to client
        ]),
        seller_schema_1.Seller.find(filter).select("name slug logo -_id").lean(),
    ]);
    const sellers = sellersDoc.map(({ name, slug, logo }) => ({
        name,
        slug,
        image: logo ?? null,
    }));
    return { categories, products, sellers };
};
exports.getSuggestions = getSuggestions;
//# sourceMappingURL=public.service.js.map