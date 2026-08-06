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
const assertUniqSlug = async (slug, sellerId, excludeId) => {
    const filter = { sellerId, slug };
    if (excludeId)
        filter._id = { $ne: excludeId };
    const exists = await category_schema_1.default.findOne(filter).lean();
    if (exists)
        throw new appError_1.AppError(`Category "${slug}" already exists`, 409);
};
// ─── helpers ─────────────────────────────────────────────
const generateSlug = (name) => {
    const slug = (0, slugify_1.default)(name, { lower: true, strict: true });
    return slug || `category-${Date.now()}`;
};
// ─── Create Category ─────────────────────────────────────
const createCategory = async (payload) => {
    const { sellerId, name, parentId, image, createdBy, isActive } = payload;
    const slug = generateSlug(name);
    const normalizedParentId = parentId ?? null;
    // duplicate check — scoped to sellerId + slug + parentId,
    // matching the schema's unique index exactly
    const exists = await category_schema_1.default.findOne({
        sellerId,
        slug,
        parentId: normalizedParentId,
    }).lean();
    if (exists)
        throw new appError_1.AppError(`Category "${slug}" already exists`, 409);
    // validate parent, if provided
    if (normalizedParentId) {
        const parent = await category_schema_1.default.findOne({
            _id: normalizedParentId,
            sellerId,
        }).lean();
        if (!parent)
            throw new appError_1.AppError("Parent category not found", 404);
        if (!parent.isActive) {
            throw new appError_1.AppError("Parent category is inactive", 400);
        }
    }
    // path, depth, slugPath are computed automatically by the pre("save") hook —
    // do not set them manually here
    const category = new category_schema_1.default({
        sellerId,
        name,
        slug,
        parentId: normalizedParentId,
        image: image ?? null,
        createdBy,
        isActive: isActive ?? true,
    });
    await category.save();
    return category;
};
exports.createCategory = createCategory;
// ─── Update Category (handles re-parenting) ──────────────
// export const updateCategory = async (payload: {
//   categoryId: string;
//   sellerId: mongoose.Types.ObjectId;
//   name?: string;
//   parentId?: string | null;
//   image?: string | null;
//   isActive?: boolean;
// }) => {
//   const { categoryId, sellerId, name, parentId, image, isActive } = payload;
//   const category = await Category.findOne({ _id: categoryId, sellerId });
//   if (!category) throw new AppError("Category not found", 404);
//   // prevent a category from becoming its own ancestor
//   if (parentId !== undefined && parentId !== null) {
//     if (parentId === categoryId) {
//       throw new AppError("A category cannot be its own parent", 400);
//     }
//     const newParent = await Category.findOne({
//       _id: parentId,
//       sellerId,
//     }).lean();
//     if (!newParent) throw new AppError("Parent category not found", 404);
//     if (!newParent.isActive) {
//       throw new AppError("Parent category is inactive", 400);
//     }
//     if (newParent.path.some((id) => id.equals(category._id))) {
//       throw new AppError(
//         "Cannot move a category under its own descendant",
//         400,
//       );
//     }
//   }
//   if (name !== undefined) {
//     const newSlug = generateSlug(name);
//     const normalizedParentId =
//       parentId !== undefined ? parentId : category.parentId;
//     const exists = await Category.findOne({
//       sellerId,
//       slug: newSlug,
//       parentId: normalizedParentId,
//       _id: { $ne: category._id },
//     }).lean();
//     if (exists) {
//       throw new AppError(`Category "${newSlug}" already exists`, 409);
//     }
//     category.name = name;
//     category.slug = newSlug;
//   }
//   if (parentId !== undefined) {
//     category.parentId = parentId ? new mongoose.Types.ObjectId(parentId) : null;
//   }
//   if (image !== undefined) category.image = image;
//   if (isActive !== undefined) category.isActive = isActive;
//   // hook recomputes path/depth/slugPath since parentId/slug may have changed
//   await category.save();
//   // NOTE: if this category has children, their own path/depth/slugPath
//   // are now stale and need a cascade update — see cascadeUpdateDescendants below
//   await cascadeUpdateDescendants(category);
//   return category;
// };
// ─── Cascade path/depth/slugPath to descendants after a re-parent ──
async function cascadeUpdateDescendants(parent) {
    const children = await category_schema_1.default.find({ parentId: parent._id });
    for (const child of children) {
        child.path = [...parent.path, parent._id];
        child.depth = parent.depth + 1;
        child.slugPath = [...parent.slugPath, child.slug];
        await child.save(); // triggers hook again, but values already match — safe
        await cascadeUpdateDescendants(child); // recurse
    }
}
const getCategoryTree = async (payload) => {
    const { sellerId, query, skip, limit } = payload;
    const baseFilter = {
        sellerId,
        isActive: true,
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
        sellerId,
        isActive: true,
        parentId: { $in: matched.map((c) => c._id) },
    })
        .select("parentId")
        .lean();
    const hasChildrenSet = new Set(childDocs.map((c) => c.parentId.toHexString()));
    const categories = matched.map((c) => {
        const ancestorIds = c.path ? c.path.split(",") : [];
        const ancestorList = ancestorIds
            .map((id) => {
            const a = ancestorMap.get(id);
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
exports.getCategoryTree = getCategoryTree;
// ─── Get All Categories (Flat List with Pagination) ───────
const getCategories = async (payload) => {
    const { sellerId, page, limit, search, parentId, depth, isActive } = payload;
    const filter = { sellerId };
    if (isActive !== undefined)
        filter.isActive = isActive;
    if (depth !== undefined)
        filter.depth = depth;
    if (parentId !== undefined)
        filter.parentId = parentId ?? null;
    if (search) {
        filter.name = { $regex: search, $options: "i" };
    }
    const [categories, total] = await Promise.all([
        category_schema_1.default.find(filter)
            .populate("parentId", "name slug depth")
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
        sellerId: payload.sellerId,
    })
        .populate("parentId", "name slug depth")
        .lean();
    if (!category)
        throw new appError_1.AppError("Category not found", 404);
    return category;
};
exports.getCategoryById = getCategoryById;
// ─── Update Category ──────────────────────────────────────
const updateCategory = async (payload) => {
    const { id, sellerId, data } = payload;
    const category = await category_schema_1.default.findOne({ _id: id, sellerId });
    if (!category)
        throw new appError_1.AppError("Category not found", 404);
    const before = {
        name: category.name,
        image: category.image,
    };
    // if name changes — regenerate slug and check uniqueness
    if (data.name && data.name !== category.name) {
        const newSlug = generateSlug(data.name);
        await assertUniqSlug(newSlug, sellerId, id);
        category.slug = newSlug;
        category.name = data.name;
    }
    if (data.image !== undefined)
        category.image = data.image;
    if (data.isActive !== undefined)
        category.isActive = data.isActive;
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
    const { id, sellerId } = payload;
    const category = await category_schema_1.default.findOne({ _id: id, sellerId });
    if (!category)
        throw new appError_1.AppError("Category not found", 404);
    // Check for children
    const hasChildren = await category_schema_1.default.exists({ sellerId, parentId: id });
    if (hasChildren) {
        throw new appError_1.AppError("Cannot delete a category that has subcategories. Delete children first.", 400);
    }
    category.isActive = false;
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
    const { sellerId, search, skip, limit } = payload;
    const baseFilter = {
        sellerId,
        isActive: true,
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
            sellerId,
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
        sellerId,
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
//# sourceMappingURL=category.service.js.map