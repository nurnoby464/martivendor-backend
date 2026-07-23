import mongoose from "mongoose";
import slugify from "slugify";
import Product from "./product.schema";
import Category from "../category/category.schema";
import Vendor from "../vendor/vendor.schema";
import { AppError } from "../../middlewares/appError";
import ProductVariant from "../product-variant/product-variant.schema";
import { IAttribute } from "../product-variant/product-variant.interface";
import { auditLog } from "../../utils/auditLogger";
import { AUDIT_ACTIONS } from "../audit/audit.interface";
import { Request } from "express";
import { compareSync } from "bcryptjs";
import { CreateProductInput } from "./product.validation";
import { sanitizeData } from "../../utils/sanitizeData";

// ─── helpers ─────────────────────────────────────────────
const generateSlug = (name: string): string => {
  const slug = slugify(name, { lower: true, strict: true });
  return slug || `product-${Date.now()}`;
};

// const assertUniqProductSku = async (
//   sku: string,
//   sellerId: mongoose.Types.ObjectId,
//   excludeId?: string,
// ) => {
//   const filter: Record<string, unknown> = { sellerId, sku };
//   if (excludeId) filter._id = { $ne: excludeId };
//   const exists = await Product.findOne(filter).lean();
//   if (exists) throw new AppError(`Product SKU "${sku}" already exists`, 409);
// };

// const assertUniqVariantSku = async (
//   sku: string,
//   sellerId: mongoose.Types.ObjectId,
//   excludeId?: string,
// ) => {
//   const filter: Record<string, unknown> = { sellerId, sku };
//   if (excludeId) filter._id = { $ne: excludeId };
//   const exists = await ProductVariant.findOne(filter).lean();
//   if (exists) throw new AppError(`Variant SKU "${sku}" already exists`, 409);
// };

// ─── Create product ───────────────────────────────────────
// export const createProduct = async (
//   payload: CreateProductInput & {
//     sellerId: mongoose.Types.ObjectId;
//     createdBy: mongoose.Types.ObjectId;
//   },
//   req: Request,
// ) => {
//   const { sellerId, createdBy, ...rest } = payload;

//   // validate category belongs to company
//   // const category = await Category.findOne({
//   //   _id: category_id,
//   //   sellerId,
//   //   is_active: true,
//   // }).lean();
//   // if (!category) throw new AppError("Category not found or inactive", 404);
//   const slug = generateSlug(rest.name);
//   // validate vendor belongs to company
//   // const vendor = await Vendor.findOne({
//   //   _id: vendor_id,
//   //   sellerId,
//   //   is_active: true,
//   // }).lean();
//   // if (!vendor) throw new AppError("Vendor not found or inactive", 404);

//   // unique slug check
//   const slugExists = await Product.findOne({ sellerId, slug }).lean();
//   if (slugExists)
//     throw new AppError(`Product "${rest.name}" already exists`, 409);

//   const product = await Product.create(
//     sanitizeData({ ...rest, sellerId, createdBy, slug }),
//   );

//   auditLog({
//     req,
//     action: AUDIT_ACTIONS.PRODUCT_CREATED,
//     targetModel: "Product",
//     targetId: product._id,
//     after: {
//       name: product.name,
//       slug: product.slug,
//       buying_price: product.buying_price,
//       selling_price: product.selling_price,
//       description: product.description,
//       category_id: product.category_id,
//       vendor_id: product.vendor_id,
//     },
//   });

//   return product;
// };

// ─── Get all products (paginated) ────────────────────────
export const getProducts = async (payload: {
  sellerId: mongoose.Types.ObjectId;
  page: number;
  limit: number;
  search?: string;
  category_id?: string;
  vendor_id?: string;
  has_variants?: boolean;
  is_active?: boolean;
  low_stock?: string;
  sort_by: string;
  sort_order: string;
}) => {
  const {
    sellerId,
    page,
    limit,
    search,
    category_id,
    vendor_id,
    has_variants,
    is_active,
    low_stock,
    sort_by,
    sort_order,
  } = payload;

  if (!sellerId) throw new AppError("sellerId is required", 400);
  const filter: Record<string, unknown> = { sellerId };

  if (is_active !== undefined) filter.is_active = is_active;
  if (has_variants !== undefined) filter.has_variants = has_variants;
  if (category_id) {
    const allDescendantCategories = await Category.find({
      sellerId,
      path: new mongoose.Types.ObjectId(category_id), // ✅ array contains match
      is_active: true,
    }).lean();

    const allCategoryIds = [
      new mongoose.Types.ObjectId(category_id),
      ...allDescendantCategories.map((c) => c._id),
    ];
    filter.category_id = { $in: allCategoryIds };
  }
  if (vendor_id) filter.vendor_id = vendor_id;

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
      .populate("category_id", "name slug depth")
      // .populate("vendor_id", "name phone")
      .sort({ [sort_by]: sortDir })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return { products, total };
};

// ─── Get one product ──────────────────────────────────────
export const getProductById = async (payload: {
  id: string;
  sellerId: mongoose.Types.ObjectId;
}) => {
  const product = await Product.findOne({
    _id: payload.id,
    sellerId: payload.sellerId,
  })
    .populate("category_id", "name slug path depth")
    // .populate("vendor_id", "name phone email")
    .populate("createdBy", "name email")
    .lean();

  if (!product) throw new AppError("Product not found", 404);

  // attach variants if has_variants
  let variants: any[] = [];
  if (product.has_variants) {
    variants = await ProductVariant.find({
      sellerId: payload.sellerId,
      product_id: payload.id,
      is_active: true,
    }).lean();
  }

  return { product, variants };
};

// ─── Update product ───────────────────────────────────────
export const updateProduct = async (payload: {
  id: string;
  sellerId: mongoose.Types.ObjectId;
  req: Request;
  data: {
    category_id?: string;
    vendor_id?: string;
    name?: string;
    description?: string | null;
    images?: string[];
    buying_price?: number;
    selling_price?: number;
    stock?: number;
    low_stock_alert?: number;
    is_active?: boolean;
  };
}) => {
  const { id, sellerId, data } = payload;

  const product = await Product.findOne({ _id: id, sellerId });
  if (!product) throw new AppError("Product not found", 404);

  // validate new category if changing
  if (data.category_id) {
    const category = await Category.findOne({
      _id: data.category_id,
      sellerId,
      is_active: true,
    }).lean();
    if (!category) throw new AppError("Category not found or inactive", 404);
    product.category_id = new mongoose.Types.ObjectId(data.category_id);
  }

  // validate new vendor if changing
  if (data.vendor_id) {
    const vendor = await Vendor.findOne({
      _id: data.vendor_id,
      sellerId,
      is_active: true,
    }).lean();
    if (!vendor) throw new AppError("Vendor not found or inactive", 404);
    // product.vendor_id = new mongoose.Types.ObjectId(data.vendor_id);
  }
  const before: Record<string, unknown> = {
    name: product.name,
    sellerId: product.sellerId,
    category_id: product.category_id,
    // vendor_id: product.vendor_id,
  };

  // regenerate slug if name changes
  if (data.name && data.name !== product.name) {
    const newSlug = generateSlug(data.name);
    const slugExists = await Product.findOne({
      sellerId,
      slug: newSlug,
      _id: { $ne: id },
    }).lean();
    if (slugExists)
      throw new AppError(`Product "${data.name}" already exists`, 409);
    product.slug = newSlug;
    product.name = data.name;
  }

  // block manual stock update if has_variants
  if (data.stock !== undefined && product.has_variants) {
    throw new AppError(
      "Cannot set stock directly on a product with variants",
      400,
    );
  }

  if (data.description !== undefined) product.description = data.description;
  if (data.images !== undefined) product.images = data.images;
  if (data.buying_price !== undefined) product.buying_price = data.buying_price;
  if (data.selling_price !== undefined)
    product.selling_price = data.selling_price;
  if (data.stock !== undefined) product.stock = data.stock;
  if (data.low_stock_alert !== undefined)
    product.low_stock_alert = data.low_stock_alert;
  if (data.is_active !== undefined) product.is_active = data.is_active;

  await product.save(); // pre-save hook recalculates profit + margin
  auditLog({
    req: payload.req,
    action: AUDIT_ACTIONS.PRODUCT_UPDATED,
    targetModel: "Product",
    targetId: product._id,
    before: before,
    after: {
      name: product.name,
      slug: product.slug,
      buying_price: product.buying_price,
      selling_price: product.selling_price,
      sellerId: product.sellerId,
      category_id: product.category_id,
      // vendor_id: product.vendor_id,
    },
  });
  return product;
};

// ─── Delete product ───────────────────────────────────────
export const deleteProduct = async (payload: {
  id: string;
  sellerId: mongoose.Types.ObjectId;
  req: Request;
}) => {
  const { id, sellerId } = payload;

  const product = await Product.findOne({ _id: id, sellerId });
  if (!product) throw new AppError("Product not found", 404);
  const before = {
    name: product.name,
  };
  // soft delete product
  product.is_active = false;
  await product.save();

  // soft delete all variants
  if (product.has_variants) {
    await ProductVariant.updateMany({ product_id: id }, { is_active: false });
  }
  auditLog({
    req: payload.req,
    action: AUDIT_ACTIONS.PRODUCT_DELETED,
    targetModel: "Product",
    targetId: product._id,
    before: before,
    after: null,
  });
  return product;
};
