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
import { CreateProductInput, GetProductViewQuery } from "./product.validation";
import { sanitizeData } from "../../utils/sanitizeData";
import { ProductTag, ProductType } from "./product.interface";
import { extractAsin } from "../../utils/helper";

// ─── helpers ─────────────────────────────────────────────
const generateSlug = (name: string): string => {
  const slug = slugify(name, { lower: true, strict: true });
  return slug || `product-${Date.now()}`;
};

interface CreateProductContext {
  sellerId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
}

async function buildUniqueSlug(
  sellerId: mongoose.Types.ObjectId,
  name: string,
  session: mongoose.ClientSession,
): Promise<string> {
  const base =
    slugify(name, { lower: true, strict: true }).slice(0, 180) || "product";
  let candidate = base;

  // Bounded retry rather than an unbounded loop — 5 name-collision attempts
  // is already generous for a single seller.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const exists = await Product.exists({ sellerId, slug: candidate }).session(
      session,
    );
    if (!exists) return candidate;
    candidate = `${base}-${attempt + 1}`;
  }
  // Last resort: guarantee uniqueness with a short random suffix instead of
  // failing the whole create over a slug collision.
  return `${base}-${new mongoose.Types.ObjectId().toString().slice(-6)}`;
}

export async function recalculateProductAggregates(
  productId: mongoose.Types.ObjectId,
  session?: mongoose.ClientSession,
) {
  // exactOptionalPropertyTypes: true means { session: undefined } is not
  // the same as omitting `session` entirely — Mongoose's UpdateOptions
  // wants the key absent, not present-with-undefined. Conditional spread
  // instead of passing `{ session }` directly, same fix as the earlier
  // `search` key issue in useCategoryTree.
  const options = session ? { session } : {};

  const variants = await ProductVariant.find({ productId, isActive: true })
    .select("sellingPrice stock discountValue")
    .session(session ?? null)
    .lean();

  if (variants.length === 0) {
    // No active variants left (e.g. all deleted/deactivated) — zero out
    // rather than leaving stale numbers from before.
    await Product.updateOne(
      { _id: productId },
      {
        $set: {
          displayPriceMin: 0,
          displayPriceMax: 0,
          totalStock: 0,
          variantCount: 0,
          hasDiscount: false,
        },
      },
      options,
    );
    return;
  }

  const prices = variants.map((v) => v.sellingPrice);
  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
  const hasDiscount = variants.some((v) => (v.discountValue ?? 0) > 0);

  await Product.updateOne(
    { _id: productId },
    {
      $set: {
        displayPriceMin: Math.min(...prices),
        displayPriceMax: Math.max(...prices),
        totalStock,
        variantCount: variants.length,
        hasDiscount,
      },
    },
    options,
  );
}

export async function createProduct(
  ctx: CreateProductContext,
  input: CreateProductInput,
) {
  // ---- Validation: productType is required, first thing checked ----
  if (!input.productType) {
    throw new AppError("productType is required", 400);
  }
  if (!Object.values(ProductType).includes(input.productType)) {
    throw new AppError("Invalid productType", 400);
  }

  const session = await mongoose.startSession();
  let resultProductId: mongoose.Types.ObjectId | undefined;

  try {
    await session.withTransaction(async () => {
      const attributes = [
        { key: "color", value: input.color },
        ...(input.size ? [{ key: "size", value: input.size }] : []),
      ];

      // ---- Branch 1: attach a new variant to an EXISTING product ----
      // Only valid if the existing product's productType matches the incoming one.
      if (input.productId) {
        const product = await Product.findOne({
          _id: new mongoose.Types.ObjectId(input.productId),
          sellerId: ctx.sellerId, // ownership check — can't add variants to another seller's product
        }).session(session);

        if (!product) {
          throw new AppError("Product not found", 404);
        }

        if (product.productType === input.productType) {
          // productType matches — proceed as a variant of the existing product.
          const duplicate = await ProductVariant.findOne({
            productId: product._id,
            attributes: { $all: attributes.map((a) => ({ $elemMatch: a })) },
          }).session(session);
          if (duplicate) {
            throw new AppError(
              "A variant with this color/size already exists for this product",
              409,
            );
          }

          const existingVariantCount = await ProductVariant.countDocuments({
            productId: product._id,
          }).session(session);
          const nextSuffix = String(existingVariantCount + 1).padStart(2, "0");

          const [variant] = await ProductVariant.create(
            [
              {
                productId: product._id,
                sellerId: ctx.sellerId,
                attributes,
                sku: `${product.sku}-${nextSuffix}`,
                image: input.image ?? null,
                buyingPrice: input.buyingPrice,
                sellingPrice: input.sellingPrice,
                stock: input.stock,
                lowStockAlert: input.lowStockAlert,
                discountType: input.discount > 0 ? "percentage" : null,
                discountValue: input.discount,
                isActive: true,
              },
            ],
            { session },
          );
          if (!variant) throw new AppError("Variant creation failed", 500);

          if (input.image) {
            await Product.updateOne(
              { _id: product._id },
              { $addToSet: { images: input.image } },
              { session },
            );
          }

          await recalculateProductAggregates(product._id, session);

          resultProductId = product._id;
          return;
        }
        // productType does NOT match — fall through to Branch 2 and
        // create a brand-new product instead of attaching a variant here.
      }

      // ---- Branch 2: create a brand-new product + its first variant ----
      const slug = await buildUniqueSlug(ctx.sellerId, input.name, session);
      console.log(slug);

      const [product] = await Product.create(
        [
          {
            sellerId: ctx.sellerId,
            categoryId: new mongoose.Types.ObjectId(input.categoryId),
            name: input.name,
            slug,
            productType: input.productType, // NEW
            sellingPrice: input.sellingPrice,
            buyingPrice: input.buyingPrice,
            description: input.description || null,
            specification: input.specifications || null,
            images: input.image ? [input.image] : [],
            tags: input.tags,
            discount: input.discount,
            hasDiscount: input.discount > 0 ? true : false,
            showOnHomepage: input.showOnHomepage,
            hasVariants: true,
            isActive: true,
            createdBy: ctx.createdBy,
          },
        ],
        { session },
      );
      if (!product) throw new AppError("Product created failed", 500);

      const [variant] = await ProductVariant.create(
        [
          {
            productId: product._id,
            sellerId: ctx.sellerId,
            attributes,
            sku: `${product.sku}-01`,
            image: input.image ?? null,
            buyingPrice: input.buyingPrice,
            sellingPrice: input.sellingPrice,
            stock: input.stock,
            lowStockAlert: input.lowStockAlert,
            discountType: input.discount > 0 ? "percentage" : null,
            discountValue: input.discount,
            isActive: true,
          },
        ],
        { session },
      );
      if (!variant) throw new AppError("Variant created failed", 500);

      await recalculateProductAggregates(product._id, session);

      resultProductId = product._id;
    });
  } catch (err: any) {
    console.log(err);
    if (err?.code === 11000) {
      throw new AppError("A product with this SKU or slug already exists", 409);
    }
    throw err;
  } finally {
    await session.endSession();
  }

  if (!resultProductId) {
    throw new AppError("Product creation failed unexpectedly", 500);
  }

  return Product.findById(resultProductId)
    .populate("categoryId", "name slug")
    .lean();
}

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
//   //   _id: categoryId,
//   //   sellerId,
//   //   isActive: true,
//   // }).lean();
//   // if (!category) throw new AppError("Category not found or inactive", 404);
//   const slug = generateSlug(rest.name);
//   // validate vendor belongs to company
//   // const vendor = await Vendor.findOne({
//   //   _id: vendor_id,
//   //   sellerId,
//   //   isActive: true,
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
//       buyingPrice: product.buyingPrice,
//       sellingPrice: product.sellingPrice,
//       description: product.description,
//       categoryId: product.categoryId,
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
  categoryId?: string;
  // vendor_id?: string;
  hasVariants?: boolean;
  isActive?: boolean;
  low_stock?: string;
  sortBy: string;
  sortOrder: string;
  productType: ProductType;
  tags: ProductTag;
  discount: number;
  hasDiscount: boolean;
}) => {
  const {
    sellerId,
    page,
    limit,
    search,
    categoryId,
    // vendor_id,
    hasVariants,
    isActive,
    low_stock,
    sortBy,
    sortOrder,
    productType,
    tags,
    discount,
    hasDiscount,
  } = payload;

  if (!sellerId) throw new AppError("sellerId is required", 400);
  const filter: Record<string, unknown> = { sellerId };

  if (isActive !== undefined) filter.isActive = isActive;
  if (hasVariants !== undefined) filter.hasVariants = hasVariants;
  if (categoryId) {
    const allDescendantCategories = await Category.find({
      sellerId,
      path: new mongoose.Types.ObjectId(categoryId), // ✅ array contains match
      isActive: true,
    }).lean();

    const allCategoryIds = [
      new mongoose.Types.ObjectId(categoryId),
      ...allDescendantCategories.map((c) => c._id),
    ];
    filter.categoryId = { $in: allCategoryIds };
  }
  // if (vendor_id) filter.vendor_id = vendor_id;

  // low stock filter — stock <= lowStockAlert
  if (low_stock === "true") {
    filter.$expr = { $lte: ["$stock", "$lowStockAlert"] };
  }

  if (productType) filter.productType = productType;
  if (discount) filter.discount = discount;
  if (hasDiscount) filter.hasDiscount = hasDiscount;
  if (tags && tags?.length > 0) filter.tags = { $in: tags };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
    ];
  }

  const sortDir = sortOrder === "asc" ? 1 : -1;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("categoryId", "name slug depth")
      // .populate("vendor_id", "name phone")
      .sort({ [sortBy]: sortDir })
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
    .populate("categoryId", "name slug path depth")
    // .populate("vendor_id", "name phone email")
    .populate("createdBy", "name email")
    .lean();

  if (!product) throw new AppError("Product not found", 404);

  // attach variants if hasVariants
  let variants: any[] = [];
  if (product.hasVariants) {
    variants = await ProductVariant.find({
      sellerId: payload.sellerId,
      product_id: payload.id,
      isActive: true,
    }).lean();
  }

  return { product, variants };
};
export const getProductBySlug = async (payload: {
  slug: string;
  // sellerId: mongoose.Types.ObjectId;
}) => {
  const asin = extractAsin(payload.slug);

  const filter: Record<string, unknown> =
    asin !== null && asin !== undefined && asin !== ""
      ? { asin: asin }
      : { slug: payload.slug };

  const product = await Product.findOne(filter)
    .populate("categoryId", "name slug path depth")
    // .populate("vendor_id", "name phone email")
    .populate("createdBy", "name email")
    .lean();

  if (!product) throw new AppError("Product not found", 404);

  // attach variants if hasVariants
  let variants: any[] = [];
  if (product.hasVariants) {
    variants = await ProductVariant.find({
      // sellerId: payload.sellerId,
      productId: product._id,
      isActive: true,
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
    categoryId?: string;
    vendor_id?: string;
    name?: string;
    description?: string | null;
    images?: string[];
    buyingPrice?: number;
    sellingPrice?: number;
    stock?: number;
    lowStockAlert?: number;
    isActive?: boolean;
  };
}) => {
  const { id, sellerId, data } = payload;

  const product = await Product.findOne({ _id: id, sellerId });
  if (!product) throw new AppError("Product not found", 404);

  // validate new category if changing
  if (data.categoryId) {
    const category = await Category.findOne({
      _id: data.categoryId,
      sellerId,
      isActive: true,
    }).lean();
    if (!category) throw new AppError("Category not found or inactive", 404);
    product.categoryId = new mongoose.Types.ObjectId(data.categoryId);
  }

  // validate new vendor if changing
  if (data.vendor_id) {
    const vendor = await Vendor.findOne({
      _id: data.vendor_id,
      sellerId,
      isActive: true,
    }).lean();
    if (!vendor) throw new AppError("Vendor not found or inactive", 404);
    // product.vendor_id = new mongoose.Types.ObjectId(data.vendor_id);
  }
  const before: Record<string, unknown> = {
    name: product.name,
    sellerId: product.sellerId,
    categoryId: product.categoryId,
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

  // block manual stock update if hasVariants
  if (data.stock !== undefined && product.hasVariants) {
    throw new AppError(
      "Cannot set stock directly on a product with variants",
      400,
    );
  }

  if (data.description !== undefined) product.description = data.description;
  if (data.images !== undefined) product.images = data.images;
  if (data.buyingPrice !== undefined) product.buyingPrice = data.buyingPrice;
  if (data.sellingPrice !== undefined) product.sellingPrice = data.sellingPrice;
  if (data.stock !== undefined) product.stock = data.stock;
  if (data.lowStockAlert !== undefined)
    product.lowStockAlert = data.lowStockAlert;
  if (data.isActive !== undefined) product.isActive = data.isActive;

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
      buyingPrice: product.buyingPrice,
      sellingPrice: product.sellingPrice,
      sellerId: product.sellerId,
      categoryId: product.categoryId,
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
  product.isActive = false;
  await product.save();

  // soft delete all variants
  if (product.hasVariants) {
    await ProductVariant.updateMany({ product_id: id }, { isActive: false });
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

export const getProductView = async (payload: GetProductViewQuery) => {
  const { productId, variantId } = payload;
  const filter: Record<string, unknown> = {
    productId: productId,
    isActive: true,
    stock: { $gt: 0 },
  };
  if (variantId) filter._id = variantId;

  const product = await ProductVariant.findOne(filter)
    .populate(
      "productId",
      "name slug description images specification productType",
    )
    .lean();
  if (!product) throw new AppError("Variant not found", 404);
  return product;
};
