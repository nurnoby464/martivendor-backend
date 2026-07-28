// category.service.ts
import mongoose from "mongoose";
import slugify from "slugify";
import Category from "./category.schema";
import { AppError } from "../../middlewares/appError";
import { Request } from "express";
import { auditLog } from "../../utils/auditLogger";
import { AUDIT_ACTIONS } from "../audit/audit.interface";
import { AnyARecord } from "node:dns";
import { ICategoryDocument } from "./category.interface";

// ─── helpers ─────────────────────────────────────────────
const generateSlug = (name: string): string => {
  const slug = slugify(name, { lower: true, strict: true });
  return slug || `category-${Date.now()}`;
};

const assertUniqSlug = async (
  slug: string,
  sellerId: mongoose.Types.ObjectId,
  excludeId?: string,
) => {
  console.log(slug);
  const filter: Record<string, unknown> = { sellerId, slug };
  if (excludeId) filter._id = { $ne: excludeId };
  const exists = await Category.findOne(filter).lean();
  if (exists) throw new AppError(`Category "${slug}" already exists`, 409);
};

// ─── Create Category ─────────────────────────────────────
// category.service.ts - Update createCategory

export const createCategory = async (payload: {
  sellerId: mongoose.Types.ObjectId;
  name: string;
  parentId?: string | null;
  image?: string | null;
  createdBy: mongoose.Types.ObjectId;
  isActive:boolean;
  req: Request;
}) => {
  const { sellerId, name, parentId, image, createdBy } = payload;

  const slug = generateSlug(name);
  // await assertUniqSlug(slug, sellerId);

  const filter: Record<string, unknown> = { sellerId, slug, parentId };
  const exists = await Category.findOne(filter).lean();
  if (exists) throw new AppError(`Category "${slug}" already exists`, 409);
  let path: mongoose.Types.ObjectId[] = [];
  let depth = 0;

  if (parentId) {
    const parent = await Category.findOne({
      _id: parentId,
      sellerId,
    }).lean();
    if (!parent) throw new AppError("Parent category not found", 404);
    if (!parent.isActive)
      throw new AppError("Parent category is inactive", 400);

    // ✅ Array spread instead of string concatenation
    path = [...parent.path, parent._id];
    depth = parent.depth + 1;
  }

  const category = await Category.create({
    sellerId,
    name,
    slug,
    parentId: parentId ?? null,
    path,
    depth,
    image: image ?? null,
    createdBy,
  });

  return category;
};

// ─── Get Category Tree (Nested Structure) ─────────────────
// export const getCategoryTree = async (payload: {
//   sellerId: mongoose.Types.ObjectId;
//   id?: string;
// }) => {
//   const { sellerId, id } = payload;

//   const allCategories = await Category.find({
//     sellerId,
//     isActive: true,
//   }).sort({ depth: 1, name: 1 }).lean();
//   console.log(allCategories)

//   const buildTree = (parentId: string | null = null): any[] => {
//     return allCategories
//       .filter(cat => {
//         if (parentId === null) return !cat.parentId;
//         return cat.parentId?.toString() === parentId;
//       })
//       .map(cat => ({
//         id: cat._id,
//         _id:cat._id,
//         name: cat.name,
//         slug: cat.slug,
//         image: cat.image,
//         depth: cat.depth,
//         parentId: cat.parentId,
//         children: buildTree(cat._id.toString())
//       }));
//   };

//   if (id) {
//     // Get specific root and its tree
//     const root = allCategories.find(cat => cat._id.toString() === id);
//     if (!root) throw new AppError("Category not found", 404);
//     return buildTree(id);
//   } else {
//     // Get full tree (all root categories)
//     return buildTree();
//   }
// };
type LeanCategory = {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  depth: number;
  parentId: mongoose.Types.ObjectId | null;
  path: string;
  isActive: boolean;
  sellerId: mongoose.Types.ObjectId;
  image: string | null;
};

type CategoryFlatItem = {
  _id: mongoose.Types.ObjectId;
  name: string;
  fullPath: string;
  depth: number;
  parentId: mongoose.Types.ObjectId | null;
};

// export const getCategoryTree = async (payload: {
//   sellerId: mongoose.Types.ObjectId;
//   search?: string;
// }): Promise<CategoryFlatItem[]> => {
//   const { sellerId, search } = payload;

//   let categories: LeanCategory[];

//   if (search) {
//     const matched = await Category.findOne({
//       sellerId,
//       isActive: true,
//       name: { $regex: search.trim(), $options: "i" },
//     }).lean<LeanCategory>();

//     if (!matched) return [];

//     categories = await Category.find({
//       sellerId,
//       isActive: true,
//       $or: [{ _id: matched._id }, { path: matched._id.toHexString() }],
//     }).lean<LeanCategory[]>();
//   } else {
//     categories = await Category.find({ sellerId, isActive: true })
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
//       parentId: c.parentId,
//     }));
// };

export const getCategoryTree = async (payload: {
  sellerId: mongoose.Types.ObjectId;
  query?: string;
  skip: number;
  limit: number;
}) => {
  const { sellerId, query, skip, limit } = payload;

  const baseFilter: any = {
    sellerId,
    isActive: true,
  };

  let matched: LeanCategory[];
  let total: number;

  if (query) {
    // 1. find the matched category first
    const root = await Category.findOne({
      ...baseFilter,
      name: { $regex: query.trim(), $options: "i" },
    }).lean<LeanCategory>();

    if (!root) return { categories: [], total: 0 };

    // 2. fetch root + all descendants
    const descendantFilter = {
      ...baseFilter,
      $or: [{ _id: root._id }, { path: { $regex: root._id.toHexString() } }],
    };

    [matched, total] = await Promise.all([
      Category.find(descendantFilter)
        .sort({ depth: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean<LeanCategory[]>(),
      Category.countDocuments(descendantFilter),
    ]);
  } else {
    [matched, total] = await Promise.all([
      Category.find(baseFilter)
        .sort({ depth: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean<LeanCategory[]>(),
      Category.countDocuments(baseFilter),
    ]);
  }

  if (!matched.length) return { categories: [], total };

  // collect all ancestor IDs
  const allAncestorIds = new Set<string>();
  matched.forEach((c) => {
    if (c.path) c.path.split(",").forEach((id) => allAncestorIds.add(id));
  });

  // fetch ancestors in one query
  const ancestors = await Category.find({
    _id: { $in: Array.from(allAncestorIds) },
  })
    .select("_id name depth")
    .lean<LeanCategory[]>();

  const ancestorMap = new Map<string, LeanCategory>();
  ancestors.forEach((a) => ancestorMap.set(a._id.toHexString(), a));

  // hasChildren check
  const childDocs = await Category.find({
    sellerId,
    isActive: true,
    parentId: { $in: matched.map((c) => c._id) },
  })
    .select("parentId")
    .lean<{ parentId: mongoose.Types.ObjectId }[]>();

  const hasChildrenSet = new Set(
    childDocs.map((c) => c.parentId.toHexString()),
  );

  const categories: CategorySearchItem[] = matched.map((c) => {
    const ancestorIds = c.path ? c.path.split(",") : [];
    const ancestorList: AncestorItem[] = ancestorIds
      .map((id) => {
        const a = ancestorMap.get(id);
        return a ? { _id: a._id, name: a.name, depth: a.depth } : null;
      })
      .filter(Boolean) as AncestorItem[];

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

// ─── Get All Categories (Flat List with Pagination) ───────
export const getCategories = async (payload: {
  sellerId: mongoose.Types.ObjectId;
  page: number;
  limit: number;
  search?: string;
  parentId?: string | null;
  depth?: number;
  isActive?: boolean;
}) => {
  const { sellerId, page, limit, search, parentId, depth, isActive } =
    payload;

  const filter: Record<string, unknown> = { sellerId };

  if (isActive !== undefined) filter.isActive = isActive;
  if (depth !== undefined) filter.depth = depth;
  if (parentId !== undefined) filter.parentId = parentId ?? null;

  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  const [categories, total] = await Promise.all([
    Category.find(filter)
      .populate("parentId", "name slug depth")
      .sort({ depth: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Category.countDocuments(filter),
  ]);

  return { categories, total };
};

// ─── Get Single Category ──────────────────────────────────
export const getCategoryById = async (payload: {
  id: string;
  sellerId: mongoose.Types.ObjectId;
}) => {
  const category = await Category.findOne({
    _id: payload.id,
    sellerId: payload.sellerId,
  })
    .populate("parentId", "name slug depth")
    .lean();

  if (!category) throw new AppError("Category not found", 404);
  return category;
};

// ─── Update Category ──────────────────────────────────────
export const updateCategory = async (payload: {
  id: string;
  sellerId: mongoose.Types.ObjectId;
  req: Request;
  data: {
    name?: string;
    image?: string | null; // Just the URL from Cloudinary
    isActive?: boolean;
  };
}) => {
  const { id, sellerId, data } = payload;

  const category = await Category.findOne({ _id: id, sellerId });
  if (!category) throw new AppError("Category not found", 404);

  const before: Record<string, unknown> = {
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

  if (data.image !== undefined) category.image = data.image;
  if (data.isActive !== undefined) category.isActive = data.isActive;

  await category.save();

  auditLog({
    req: payload.req,
    action: AUDIT_ACTIONS.CATEGORY_UPDATED,
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

// ─── Delete Category (Soft Delete) ────────────────────────
export const deleteCategory = async (payload: {
  id: string;
  sellerId: mongoose.Types.ObjectId;
  req: Request;
}) => {
  const { id, sellerId } = payload;

  const category = await Category.findOne({ _id: id, sellerId });
  if (!category) throw new AppError("Category not found", 404);

  // Check for children
  const hasChildren = await Category.exists({ sellerId, parentId: id });
  if (hasChildren) {
    throw new AppError(
      "Cannot delete a category that has subcategories. Delete children first.",
      400,
    );
  }

  category.isActive = false;
  await category.save();

  auditLog({
    req: payload.req,
    action: AUDIT_ACTIONS.CATEGORY_DELETED,
    targetModel: "Category",
    targetId: category._id,
    before: { name: category.name },
    after: null,
  });

  return category;
};

// category.service.ts - Add this new function

type AncestorItem = {
  _id: mongoose.Types.ObjectId;
  name: string;
  depth: number;
};

type CategorySearchItem = {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  fullPath: string;
  parentId: mongoose.Types.ObjectId | null;
  parentName: string | null;
  ancestors: AncestorItem[];
  depth: number;
  hasChildren: boolean;
  image: string | null;
};

export const searchCategories = async (payload: {
  sellerId: mongoose.Types.ObjectId;
  search?: string;
  skip: number;
  limit: number;
}): Promise<{ categories: CategorySearchItem[]; total: number }> => {
  const { sellerId, search, skip, limit } = payload;

  const baseFilter: Record<string, unknown> = {
    sellerId,
    isActive: true,
  };

  let matched: ICategoryDocument[];
  let total: number;

  if (search?.trim()) {
    // 1. find the root match
    const root = await Category.findOne({
      ...baseFilter,
      name: { $regex: `^${search.trim()}$`, $options: "i" },
    }).lean<ICategoryDocument>();

    if (!root) return { categories: [], total: 0 };

    // 2. fetch root + all descendants
    const descendantFilter: Record<string, unknown> = {
      sellerId,
      isActive: true,
      $or: [{ _id: root._id }, { path: root._id }],
    };

    [matched, total] = await Promise.all([
      Category.find(descendantFilter)
        .sort({ depth: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean<ICategoryDocument[]>(),
      Category.countDocuments(descendantFilter),
    ]);
  } else {
    [matched, total] = await Promise.all([
      Category.find(baseFilter)
        .sort({ depth: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean<ICategoryDocument[]>(),
      Category.countDocuments(baseFilter),
    ]);
  }

  if (!matched.length) return { categories: [], total };

  // collect all ancestor IDs across all matched — one flat set
  const allAncestorIds = new Set<string>();
  matched.forEach((c) => {
    c.path?.forEach((id) => allAncestorIds.add(id.toHexString()));
  });

  // fetch all ancestors in ONE query
  const ancestorDocs = await Category.find({
    _id: { $in: Array.from(allAncestorIds) },
  })
    .select("_id name depth")
    .lean<ICategoryDocument[]>();

  const ancestorMap = new Map<string, ICategoryDocument>();
  ancestorDocs.forEach((a) => ancestorMap.set(a._id.toHexString(), a));

  // check hasChildren for all matched in ONE query
  const childDocs = await Category.find({
    sellerId,
    isActive: true,
    parentId: { $in: matched.map((c) => c._id) },
  })
    .select("parentId")
    .lean<{ parentId: mongoose.Types.ObjectId }[]>();

  const hasChildrenSet = new Set(
    childDocs.map((c) => c.parentId.toHexString()),
  );

  // build response — pure in-memory, no more DB calls
  const categories: CategorySearchItem[] = matched.map((c) => {
    const ancestorList = (c.path ?? [])
      .map((id) => {
        const a = ancestorMap.get(id.toHexString());
        return a ? { _id: a._id, name: a.name, depth: a.depth } : null;
      })
      .filter(Boolean) as AncestorItem[];

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
