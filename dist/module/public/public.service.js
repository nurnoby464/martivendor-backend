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
exports.searchCategories = exports.getAllCategories = exports.getProductById = exports.dbTest = exports.getProducts = void 0;
const product_schema_1 = __importDefault(require("../product/product.schema"));
const mongoose_1 = __importStar(require("mongoose"));
const product_variant_schema_1 = __importDefault(require("../product-variant/product-variant.schema"));
const category_schema_1 = __importDefault(require("../category/category.schema"));
const appError_1 = require("../../middlewares/appError");
const getProducts = async (payload) => {
    const { company_id, page, limit, search, category_id, vendor_id, has_variants, is_active, low_stock, sort_by, sort_order, } = payload;
    if (!company_id)
        throw new appError_1.AppError("company_id is required", 400);
    const filter = { company_id };
    if (is_active !== undefined)
        filter.is_active = is_active;
    if (has_variants !== undefined)
        filter.has_variants = has_variants;
    if (category_id) {
        const allDescendantCategories = await category_schema_1.default.find({
            company_id,
            path: new mongoose_1.default.Types.ObjectId(category_id), // ✅ array contains match
            is_active: true,
        }).lean();
        const allCategoryIds = [
            new mongoose_1.default.Types.ObjectId(category_id),
            ...allDescendantCategories.map((c) => c._id),
        ];
        filter.category_id = { $in: allCategoryIds };
    }
    if (vendor_id)
        filter.vendor_id = vendor_id;
    // low stock filter — stock <= low_stock_alert
    if (low_stock === "true") {
        filter.$expr = { $lte: ["$stock", "$low_stock_alert"] };
    }
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { sku: { $regex: search, $options: "i" } },
        ];
    }
    const sortDir = sort_order === "asc" ? 1 : -1;
    const [products, total] = await Promise.all([
        product_schema_1.default.find(filter)
            .populate("category_id", "name slug depth")
            // .populate("vendor_id", "name phone")
            .sort({ [sort_by]: sortDir })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        product_schema_1.default.countDocuments(filter),
    ]);
    return { products, total };
};
exports.getProducts = getProducts;
const dbTest = async (req, query) => {
    const { vendor_id, page, category_id, limit, sort_by, sort_order, has_variants, is_active, search, low_stock, } = query;
    const filter = { company_id: "69db7c91dfc260658b4a384a" };
    if (vendor_id)
        filter.vendor_id = vendor_id;
    if (category_id)
        filter.category_id = category_id;
    if (has_variants !== undefined)
        filter.has_variants = has_variants;
    if (is_active !== undefined)
        filter.is_active = is_active;
    if (low_stock === "true")
        filter.$expr = { $lte: ["$stock", "$low_stock_alert"] };
    if (search) {
        filter.name = { $regex: search, $options: "i" };
        filter.selling_price = { $regex: search, $options: "i" };
    }
    const sortOptions = {};
    sortOptions[sort_by ?? "createdAt"] = sort_order === "asc" ? 1 : -1;
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
        .populate("category_id", "name slug path depth")
        // .populate("vendor_id", "name phone email")
        .populate("createdBy", "name email")
        .lean();
    if (!product)
        throw new appError_1.AppError("Product not found", 404);
    // attach variants if has_variants
    let variants = [];
    if (product.has_variants) {
        variants = await product_variant_schema_1.default.find({
            company_id: payload.company_id,
            product_id: payload.id,
            is_active: true,
        }).lean();
    }
    return { product, variants };
};
exports.getProductById = getProductById;
const getAllCategories = async (req) => {
    const company_id = new mongoose_1.Types.ObjectId(req.company?._id);
    const categories = await category_schema_1.default.find({ company_id })
        .sort({ createdAt: -1 })
        .lean();
    return categories;
};
exports.getAllCategories = getAllCategories;
const searchCategories = async (payload) => {
    const { company_id, search, skip, limit } = payload;
    const baseFilter = {
        company_id,
        is_active: true,
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
            company_id,
            is_active: true,
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
        company_id,
        is_active: true,
        parent_id: { $in: matched.map((c) => c._id) },
    })
        .select("parent_id")
        .lean();
    const hasChildrenSet = new Set(childDocs.map((c) => c.parent_id.toHexString()));
    // build response — pure in-memory, no more DB calls
    const categories = matched.map((c) => {
        const ancestorList = (c.path ?? [])
            .map((id) => {
            const a = ancestorMap.get(id.toHexString());
            return a ? { _id: a._id, name: a.name, depth: a.depth } : null;
        })
            .filter(Boolean);
        const parent = c.parent_id
            ? ancestorMap.get(c.parent_id.toHexString())
            : null;
        const fullPath = [...ancestorList.map((a) => a.name), c.name].join(" > ");
        return {
            _id: c._id,
            name: c.name,
            slug: c.slug,
            fullPath,
            parentId: c.parent_id ?? null,
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
//# sourceMappingURL=public.service.js.map