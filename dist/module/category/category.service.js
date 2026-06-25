"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCategories = exports.deleteCategory = exports.updateCategory = exports.getCategoryById = exports.getCategories = exports.getCategoryTree = exports.createCategory = void 0;
const slugify_1 = __importDefault(require("slugify"));
const category_schema_1 = __importDefault(require("./category.schema"));
const appError_1 = require("../../middlewares/appError");
const auditLogger_1 = require("../../utils/auditLogger");
const audit_interface_1 = require("../audit/audit.interface");
// ─── helpers ─────────────────────────────────────────────
const generateSlug = (name) => {
    const slug = (0, slugify_1.default)(name, { lower: true, strict: true });
    return slug || `category-${Date.now()}`;
};
const assertUniqSlug = async (slug, company_id, excludeId) => {
    console.log(slug);
    const filter = { company_id, slug };
    if (excludeId)
        filter._id = { $ne: excludeId };
    const exists = await category_schema_1.default.findOne(filter).lean();
    if (exists)
        throw new appError_1.AppError(`Category "${slug}" already exists`, 409);
};
// ─── Create Category ─────────────────────────────────────
// category.service.ts - Update createCategory
const createCategory = async (payload) => {
    const { company_id, name, parent_id, image, createdBy } = payload;
    const slug = generateSlug(name);
    // await assertUniqSlug(slug, company_id);
    const filter = { company_id, slug, parent_id };
    const exists = await category_schema_1.default.findOne(filter).lean();
    if (exists)
        throw new appError_1.AppError(`Category "${slug}" already exists`, 409);
    let path = [];
    let depth = 0;
    if (parent_id) {
        const parent = await category_schema_1.default.findOne({
            _id: parent_id,
            company_id,
        }).lean();
        if (!parent)
            throw new appError_1.AppError("Parent category not found", 404);
        if (!parent.is_active)
            throw new appError_1.AppError("Parent category is inactive", 400);
        // ✅ Array spread instead of string concatenation
        path = [...parent.path, parent._id];
        depth = parent.depth + 1;
    }
    const category = await category_schema_1.default.create({
        company_id,
        name,
        slug,
        parent_id: parent_id ?? null,
        path,
        depth,
        image: image ?? null,
        createdBy,
    });
    return category;
};
exports.createCategory = createCategory;
// export const getCategoryTree = async (payload: {
//   company_id: mongoose.Types.ObjectId;
//   search?: string;
// }): Promise<CategoryFlatItem[]> => {
//   const { company_id, search } = payload;
//   let categories: LeanCategory[];
//   if (search) {
//     const matched = await Category.findOne({
//       company_id,
//       is_active: true,
//       name: { $regex: search.trim(), $options: "i" },
//     }).lean<LeanCategory>();
//     if (!matched) return [];
//     categories = await Category.find({
//       company_id,
//       is_active: true,
//       $or: [{ _id: matched._id }, { path: matched._id.toHexString() }],
//     }).lean<LeanCategory[]>();
//   } else {
//     categories = await Category.find({ company_id, is_active: true })
//       .sort({ path: 1, name: 1 })
//       .lean<LeanCategory[]>();
//   }
//   // build id->name map for breadcrumb
//   const nameMap = new Map<string, string>();
//   categories.forEach((c) => nameMap.set(c._id.toHexString(), c.name));
//   const getFullPath = (c: LeanCategory): string => {
//     if (!c.path) return c.name;
//     const ancestorNames = c.path
//       .split(",")
//       .map((id) => nameMap.get(id))
//       .filter(Boolean);
//     return [...ancestorNames, c.name].join(" > ");
//   };
//   return categories
//     .sort((a, b) => {
//       const pathA = a.path ? `${a.path},${a._id}` : a._id.toHexString();
//       const pathB = b.path ? `${b.path},${b._id}` : b._id.toHexString();
//       return pathA.localeCompare(pathB);
//     })
//     .map((c) => ({
//       _id: c._id,
//       name: c.name,
//       fullPath: getFullPath(c),
//       depth: c.depth,
//       parentId: c.parent_id,
//     }));
// };
const getCategoryTree = async (payload) => {
    const { company_id, query, skip, limit } = payload;
    const baseFilter = {
        company_id,
        is_active: true,
    };
    let matched;
    let total;
    if (query) {
        // 1. find the matched category first
        const root = await category_schema_1.default.findOne({
            ...baseFilter,
            name: { $regex: query.trim(), $options: "i" },
        }).lean();
        if (!root)
            return { categories: [], total: 0 };
        // 2. fetch root + all descendants
        const descendantFilter = {
            ...baseFilter,
            $or: [{ _id: root._id }, { path: { $regex: root._id.toHexString() } }],
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
    // collect all ancestor IDs
    const allAncestorIds = new Set();
    matched.forEach((c) => {
        if (c.path)
            c.path.split(",").forEach((id) => allAncestorIds.add(id));
    });
    // fetch ancestors in one query
    const ancestors = await category_schema_1.default.find({
        _id: { $in: Array.from(allAncestorIds) },
    })
        .select("_id name depth")
        .lean();
    const ancestorMap = new Map();
    ancestors.forEach((a) => ancestorMap.set(a._id.toHexString(), a));
    // hasChildren check
    const childDocs = await category_schema_1.default.find({
        company_id,
        is_active: true,
        parent_id: { $in: matched.map((c) => c._id) },
    })
        .select("parent_id")
        .lean();
    const hasChildrenSet = new Set(childDocs.map((c) => c.parent_id.toHexString()));
    const categories = matched.map((c) => {
        const ancestorIds = c.path ? c.path.split(",") : [];
        const ancestorList = ancestorIds
            .map((id) => {
            const a = ancestorMap.get(id);
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
exports.getCategoryTree = getCategoryTree;
// ─── Get All Categories (Flat List with Pagination) ───────
const getCategories = async (payload) => {
    const { company_id, page, limit, search, parent_id, depth, is_active } = payload;
    const filter = { company_id };
    if (is_active !== undefined)
        filter.is_active = is_active;
    if (depth !== undefined)
        filter.depth = depth;
    if (parent_id !== undefined)
        filter.parent_id = parent_id ?? null;
    if (search) {
        filter.name = { $regex: search, $options: "i" };
    }
    const [categories, total] = await Promise.all([
        category_schema_1.default.find(filter)
            .populate("parent_id", "name slug depth")
            .sort({ depth: 1, name: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        category_schema_1.default.countDocuments(filter),
    ]);
    return { categories, total };
};
exports.getCategories = getCategories;
// ─── Get Single Category ──────────────────────────────────
const getCategoryById = async (payload) => {
    const category = await category_schema_1.default.findOne({
        _id: payload.id,
        company_id: payload.company_id,
    })
        .populate("parent_id", "name slug depth")
        .lean();
    if (!category)
        throw new appError_1.AppError("Category not found", 404);
    return category;
};
exports.getCategoryById = getCategoryById;
// ─── Update Category ──────────────────────────────────────
const updateCategory = async (payload) => {
    const { id, company_id, data } = payload;
    const category = await category_schema_1.default.findOne({ _id: id, company_id });
    if (!category)
        throw new appError_1.AppError("Category not found", 404);
    const before = {
        name: category.name,
        image: category.image,
    };
    // if name changes — regenerate slug and check uniqueness
    if (data.name && data.name !== category.name) {
        const newSlug = generateSlug(data.name);
        await assertUniqSlug(newSlug, company_id, id);
        category.slug = newSlug;
        category.name = data.name;
    }
    if (data.image !== undefined)
        category.image = data.image;
    if (data.is_active !== undefined)
        category.is_active = data.is_active;
    await category.save();
    (0, auditLogger_1.auditLog)({
        req: payload.req,
        action: audit_interface_1.AUDIT_ACTIONS.CATEGORY_UPDATED,
        targetModel: "Category",
        targetId: category._id,
        before: before,
        after: {
            name: category.name,
            image: category.image,
        },
    });
    return category;
};
exports.updateCategory = updateCategory;
// ─── Delete Category (Soft Delete) ────────────────────────
const deleteCategory = async (payload) => {
    const { id, company_id } = payload;
    const category = await category_schema_1.default.findOne({ _id: id, company_id });
    if (!category)
        throw new appError_1.AppError("Category not found", 404);
    // Check for children
    const hasChildren = await category_schema_1.default.exists({ company_id, parent_id: id });
    if (hasChildren) {
        throw new appError_1.AppError("Cannot delete a category that has subcategories. Delete children first.", 400);
    }
    category.is_active = false;
    await category.save();
    (0, auditLogger_1.auditLog)({
        req: payload.req,
        action: audit_interface_1.AUDIT_ACTIONS.CATEGORY_DELETED,
        targetModel: "Category",
        targetId: category._id,
        before: { name: category.name },
        after: null,
    });
    return category;
};
exports.deleteCategory = deleteCategory;
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
            name: { $regex: `^${search.trim()}$`, $options: "i" },
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
//# sourceMappingURL=category.service.js.map