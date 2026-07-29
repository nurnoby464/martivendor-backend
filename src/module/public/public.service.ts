import { categoryParamsSchema } from "./../category/category.validation";
import { Request } from "express";
import { GetProductQuery } from "../product/product.validation";
import Product from "../product/product.schema";
import { GetProductParamsQuery } from "./public.validation";
import mongoose, { Types } from "mongoose";
import ProductVariant from "../product-variant/product-variant.schema";
import Category from "../category/category.schema";
import { create } from "node:domain";
import { ICategoryDocument } from "../category/category.interface";
import { AppError } from "../../middlewares/appError";

export const getProducts = async (payload: {
  company_id: mongoose.Types.ObjectId;
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  vendorId?: string;
  hasVariants?: boolean;
  is_active?: boolean;
  low_stock?: string;
  sort_by: string;
  sort_order: string;
}) => {
  const {
    company_id,
    page,
    limit,
    search,
    categoryId,
    vendorId,
    hasVariants,
    is_active,
    low_stock,
    sort_by,
    sort_order,
  } = payload;

  if (!company_id) throw new AppError("company_id is required", 400);
  const filter: Record<string, unknown> = { company_id };

  if (is_active !== undefined) filter.is_active = is_active;
  if (hasVariants !== undefined) filter.hasVariants = hasVariants;
  if (categoryId) {
    const allDescendantCategories = await Category.find({
      company_id,
      path: new mongoose.Types.ObjectId(categoryId), // ✅ array contains match
      is_active: true,
    }).lean();

    const allCategoryIds = [
      new mongoose.Types.ObjectId(categoryId),
      ...allDescendantCategories.map((c) => c._id),
    ];
    filter.categoryId = { $in: allCategoryIds };
  }
  if (vendorId) filter.vendorId = vendorId;

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
    Product.find(filter)
      .populate("categoryId", "name slug depth")
      // .populate("vendorId", "name phone")
      .sort({ [sort_by]: sortDir })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return { products, total };
};
export const dbTest = async (req: Request, query: GetProductQuery) => {
  const {
    // vendorId,
    page,
    categoryId,
    limit,
    sortBy,
    sortOrder,
    hasVariants,
    isActive,
    search,
    lowStock,
  } = query;
  const filter: any = { company_id: "69db7c91dfc260658b4a384a" };

  // if (vendorId) filter.vendorId = vendorId;
  if (categoryId) filter.categoryId = categoryId;
  if (hasVariants !== undefined) filter.hasVariants = hasVariants;
  if (isActive !== undefined) filter.isActive = isActive;
  if (lowStock === "true")
    filter.$expr = { $lte: ["$stock", "$low_stock_alert"] };
  if (search) {
    filter.name = { $regex: search, $options: "i" };
    filter.selling_price = { $regex: search, $options: "i" };
  }

  const sortOptions: any = {};
  sortOptions[sortBy ?? "createdAt"] = sortOrder === "asc" ? 1 : -1;
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortOptions)
      .select("-buying_price -profit -profit_margin -low_stock_alert")
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);
  return { products, total, page, limit };
};

export const getProductById = async (payload: {
  id: string;
  company_id: mongoose.Types.ObjectId;
}) => {
  const product = await Product.findOne({
    _id: payload.id,
    company_id: payload.company_id,
  })
    .populate("categoryId", "name slug path depth")
    // .populate("vendorId", "name phone email")
    .populate("createdBy", "name email")
    .lean();

  if (!product) throw new AppError("Product not found", 404);

  // attach variants if hasVariants
  let variants: any[] = [];
  if (product.hasVariants) {
    variants = await ProductVariant.find({
      company_id: payload.company_id,
      product_id: payload.id,
      is_active: true,
    }).lean();
  }

  return { product, variants };
};

export const getAllCategories = async (req: Request) => {
  const company_id = new Types.ObjectId(req.company?._id);
  const categories = await Category.find({ company_id })
    .sort({ createdAt: -1 })
    .lean();
  return categories;
};

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
  company_id: mongoose.Types.ObjectId;
  search?: string;
  skip: number;
  limit: number;
}): Promise<{ categories: CategorySearchItem[]; total: number }> => {
  const { company_id, search, skip, limit } = payload;

  const baseFilter: Record<string, unknown> = {
    company_id,
    is_active: true,
  };

  let matched: ICategoryDocument[];
  let total: number;

  if (search?.trim()) {
    // 1. find the root match
    const root = await Category.findOne({
      ...baseFilter,
      $or: [
        { name: { $regex: `^${search.trim()}$`, $options: "i" } },
        { slug: { $regex: `^${search.trim()}$`, $options: "i" } },
      ],
    }).lean<ICategoryDocument>();

    if (!root) return { categories: [], total: 0 };

    // 2. fetch root + all descendants
    const descendantFilter: Record<string, unknown> = {
      company_id,
      is_active: true,
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
    company_id,
    is_active: true,
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
