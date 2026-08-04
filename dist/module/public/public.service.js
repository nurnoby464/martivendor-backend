"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicMergedCategories = exports.getCategoriesMenu = exports.searchCategories = exports.getAllCategories = exports.getProductById = exports.dbTest = exports.getProducts = void 0;
const product_schema_1 = __importDefault(require("../product/product.schema"));
const mongoose_1 = __importDefault(require("mongoose"));
const product_variant_schema_1 = __importDefault(require("../product-variant/product-variant.schema"));
const category_schema_1 = __importDefault(require("../category/category.schema"));
const appError_1 = require("../../middlewares/appError");
const getProducts = async (payload) => {
    const { page, limit, search, categoryId, 
    // vendor_id,
    hasVariants, isActive, lowStock, sortBy, sortOrder, productType, tags, discount, hasDiscount, } = payload;
    const filter = {};
    if (isActive !== undefined)
        filter.isActive = isActive;
    if (hasVariants !== undefined)
        filter.hasVariants = hasVariants;
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
    // if (vendor_id) filter.vendor_id = vendor_id;
    // low stock filter — stock <= lowStockAlert
    if (lowStock === "true") {
        filter.$expr = { $lte: ["$stock", "$lowStockAlert"] };
    }
    if (productType)
        filter.productType = productType;
    if (discount)
        filter.discount = discount;
    if (hasDiscount)
        filter.hasDiscount = hasDiscount;
    if (tags && tags?.length > 0)
        filter.tags = { $in: tags };
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { sku: { $regex: search, $options: "i" } },
        ];
    }
    const sortDir = sortOrder === "asc" ? 1 : -1;
    const [products, total] = await Promise.all([
        product_schema_1.default.find(filter)
            .populate("categoryId", "name slug depth")
            // .populate("vendor_id", "name phone")
            .sort({ [sortBy]: sortDir })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        product_schema_1.default.countDocuments(filter),
    ]);
    return { products, total };
};
exports.getProducts = getProducts;
const dbTest = async (req, query) => {
    const { 
    // vendorId,
    page, categoryId, limit, sortBy, sortOrder, hasVariants, isActive, search, lowStock, } = query;
    const filter = { company_id: "69db7c91dfc260658b4a384a" };
    // if (vendorId) filter.vendorId = vendorId;
    if (categoryId)
        filter.categoryId = categoryId;
    if (hasVariants !== undefined)
        filter.hasVariants = hasVariants;
    if (isActive !== undefined)
        filter.isActive = isActive;
    if (lowStock === "true")
        filter.$expr = { $lte: ["$stock", "$low_stock_alert"] };
    if (search) {
        filter.name = { $regex: search, $options: "i" };
        filter.selling_price = { $regex: search, $options: "i" };
    }
    const sortOptions = {};
    sortOptions[sortBy ?? "createdAt"] = sortOrder === "asc" ? 1 : -1;
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
        product_schema_1.default.find(filter)
            .sort(sortOptions)
            .select("-buying_price -profit -profit_margin -low_stock_alert")
            .skip(skip)
            .limit(limit)
            .lean(),
        product_schema_1.default.countDocuments(filter),
    ]);
    return { products, total, page, limit };
};
exports.dbTest = dbTest;
const getProductById = async (payload) => {
    const product = await product_schema_1.default.findOne({
        _id: payload.id,
        company_id: payload.company_id,
    })
        .populate("categoryId", "name slug path depth")
        // .populate("vendorId", "name phone email")
        .populate("createdBy", "name email")
        .lean();
    if (!product)
        throw new appError_1.AppError("Product not found", 404);
    // attach variants if hasVariants
    let variants = [];
    if (product.hasVariants) {
        variants = await product_variant_schema_1.default.find({
            company_id: payload.company_id,
            product_id: payload.id,
            isActive: true,
        }).lean();
    }
    return { product, variants };
};
exports.getProductById = getProductById;
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
const getCategoriesMenu = async (payload) => {
    const { search, skip, limit } = payload;
    const matchStage = {
        isActive: true,
        parentId: null, // homepage rail = top-level only
    };
    if (search?.trim()) {
        const regex = new RegExp(search.trim(), "i");
        matchStage.$or = [{ name: regex }, { slug: regex }];
    }
    const pipeline = [
        { $match: matchStage },
        // group all sellers' identical top-level categories by slug
        {
            $group: {
                _id: "$slug",
                name: { $first: "$name" },
                image: { $first: "$image" },
                sellerCategoryIds: { $push: "$_id" },
                sellerCount: { $sum: 1 },
            },
        },
        // product count across ALL underlying seller category docs for this slug
        {
            $lookup: {
                from: "products",
                let: { catIds: "$sellerCategoryIds" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $in: ["$categoryId", "$$catIds"] },
                            isActive: true,
                        },
                    },
                    { $count: "count" },
                ],
                as: "productStats",
            },
        },
        // does ANY seller's version of this category have children?
        {
            $lookup: {
                from: "categories",
                let: { catIds: "$sellerCategoryIds" },
                pipeline: [
                    {
                        $match: {
                            isActive: true,
                            $expr: { $in: ["$parentId", "$$catIds"] },
                        },
                    },
                    { $limit: 1 },
                ],
                as: "childProbe",
            },
        },
        {
            $project: {
                _id: 0,
                slug: "$_id",
                name: 1,
                image: 1,
                sellerCount: 1,
                productCount: { $ifNull: [{ $first: "$productStats.count" }, 0] },
                hasChildren: { $gt: [{ $size: "$childProbe" }, 0] },
            },
        },
        { $sort: { name: 1 } },
        // paginate the merged result set, get total in the same round-trip
        {
            $facet: {
                data: [{ $skip: skip }, { $limit: limit }],
                totalCount: [{ $count: "count" }],
            },
        },
    ];
    const result = await category_schema_1.default.aggregate(pipeline);
    const categories = result[0]?.data ?? [];
    const total = result[0]?.totalCount?.[0]?.count ?? 0;
    return { categories, total };
};
exports.getCategoriesMenu = getCategoriesMenu;
// reusable merge stage — dedupes any set of category docs by slugPath
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
//# sourceMappingURL=public.service.js.map