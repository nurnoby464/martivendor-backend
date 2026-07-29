import mongoose, { Types } from "mongoose";
import { Request } from "express";
import Product from "../product/product.schema";
import ProductVariant from "../product-variant/product-variant.schema";
import { IAttribute } from "./product-variant.interface";

import { auditLog } from "../../utils/auditLogger";
import { AUDIT_ACTIONS } from "../audit/audit.interface";
import { sanitizeData } from "../../utils/sanitizeData";
import {
  CreateVariantInput,
  EditProductVariantInput,
  UpdateVariantInput,
} from "./product-variant.validation";
import { useSkip } from "../../utils/useSkip";
import { AppError } from "../../middlewares/appError";

// interface

interface IGetProductVariant {
  req: Request;
}

export const createVariant = async (
  payload: CreateVariantInput & {
    productId: string;
    sellerId: mongoose.Types.ObjectId;
  },
  req: Request,
) => {
  const { productId, sellerId, ...rest } = payload;

  // product must exist, belong to company, and have hasVariants = true
  const product = await Product.findOne({
    _id: productId,
    sellerId,
    isActive: true,
  }).lean();
  if (!product) throw new AppError("Product not found", 404);
  if (!product.hasVariants) {
    throw new AppError(
      "This product does not support variants. Enable hasVariants first.",
      400,
    );
  }

  // unique sku
  //   await assertUniqVariantSku(sku, sellerId);

  // Block duplicate attribute combination for this product
  const duplicate = await ProductVariant.findOne({
    productId,
    isActive: true,
    $and: rest.attributes.map((a: any) => ({
      attributes: { $elemMatch: { key: a.key, value: a.value } },
    })),
  }).lean();
  if (duplicate)
    throw new AppError(
      "A variant with the same attribute combination already exists",
      409,
    );

  const variant = await ProductVariant.create(
    sanitizeData({
      ...rest,
      productId: new mongoose.Types.ObjectId(productId),
      sellerId,
    }),
  );

  auditLog({
    req,
    action: AUDIT_ACTIONS.VARIANT_CREATED,
    targetModel: "ProductVariant",
    targetId: variant._id,
    after: {
      productId: variant.productId,
    },
  });

  return variant;
};

// ─── Get variants of a product ────────────────────────────
export const getVariants = async (payload: {
  productId: string;
  sellerId: mongoose.Types.ObjectId;
}) => {
  const product = await Product.findOne({
    _id: payload.productId,
    sellerId: payload.sellerId,
  }).lean();
  if (!product) throw new AppError("Product not found", 404);

  const variants = await ProductVariant.find({
    productId: payload.productId,
  })
    .sort({ createdAt: 1 })
    .lean();

  return variants;
};
export const getVariantById = async (
  variantId: string,
  sellerId: mongoose.Types.ObjectId,
) => {
  const variant = await ProductVariant.findOne({
    _id: variantId,
    sellerId,
  }).lean();
  if (!variant) throw new AppError("Variant not found", 404);
  return variant;
};

// ─── Update variant ───────────────────────────────────────
export const updateVariant = async (
  variantId: string,
  sellerId: mongoose.Types.ObjectId,
  payload: UpdateVariantInput,
  req: Request,
) => {
  const variant = await ProductVariant.findOne({
    _id: variantId,
    sellerId,
  });
  if (!variant) throw new AppError("Variant not found", 404);

  const before = {
    productId: variant.productId,
  };

  const updated = await ProductVariant.findOneAndUpdate(
    { _id: variantId, sellerId },
    { $set: sanitizeData(payload) },
    { new: true, runValidators: true },
  ).lean();

  if (!updated) throw new AppError("Variant not found", 404);
  auditLog({
    req,
    action: AUDIT_ACTIONS.VARIANT_UPDATED,
    targetModel: "ProductVariant",
    targetId: variant._id,
    before,
    after: {
      productId: updated.productId,
    },
  });
  return updated;
};

// ─── Delete variant ───────────────────────────────────────
export const deleteVariant = async (payload: {
  id: string;
  productId: string;
  sellerId: mongoose.Types.ObjectId;
  req: Request;
}) => {
  const { id, productId, sellerId, req } = payload;

  const variant = await ProductVariant.findOne({
    _id: id,
    productId,
    sellerId,
  });
  if (!variant) throw new AppError("Variant not found", 404);

  variant.isActive = false;
  await variant.save();

  auditLog({
    req,
    action: AUDIT_ACTIONS.VARIANT_DELETED,
    targetModel: "ProductVariant",
    targetId: variant._id,
  });
  return variant;
};

export const getAllProductWithVariant = async (payload: IGetProductVariant) => {
  const { req } = payload;
  const query = req.validatedQuery as {
    page: number;
    limit: number;
    search: string;
    sortOrder: 1 | -1;
    sortBy: string;
    stock: "lowStock" | "outOfStock" | "reminderStock";
  };
  const { page, limit, search, stock, sortBy, sortOrder } = query;
  const lowStockNumber = 3;
  const sellerId = req.user.sellerId;
  if (!sellerId) {
    throw new AppError("Company is required", 400);
  }
  const filter: Record<string, unknown> = {
    sellerId: new Types.ObjectId(sellerId),
  };
  if (search) {
    const keywords = search.trim().split(/\s+/);
    filter.$and = keywords.map((word) => ({
      $or: [
        { sku: { $regex: word, $options: "i" } },
        { "attributes.value": { $regex: word, $options: "i" } },
      ],
    }));
  }
  if (stock && stock.trim() !== "") {
    if (stock === "outOfStock") {
      filter.stock = 0;
    }
    if (stock === "lowStock") {
      filter.stock = { $lte: 3, $gte: 1 };
    }
    if (stock === "reminderStock") {
      filter.$expr = {
        $and: [{ $lte: ["$stock", "$lowStockAlert"] }, { $gte: ["$stock", 1] }],
      };
    }
  }
  const [result] = await ProductVariant.aggregate([
    { $match: { sellerId: new Types.ObjectId(sellerId) } },
    {
      $facet: {
        stats: [
          {
            $group: {
              _id: null,
              totalProduct: { $sum: 1 },
              outOfStock: {
                $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] },
              },
              lowStock: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gte: ["$stock", 1] },
                        { $lte: ["$stock", lowStockNumber] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              reminderStock: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gte: ["$stock", 1] },
                        { $lte: ["$stock", "$lowStockAlert"] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ],
        total: [{ $match: filter }, { $count: "count" }],
        data: [
          { $match: filter },
          { $sort: { [sortBy]: sortOrder } },
          { $skip: useSkip({ page, limit }) },
          { $limit: limit },
          {
            $lookup: {
              from: "products",
              localField: "productId",
              foreignField: "_id",
              as: "_product",
              pipeline: [
                {
                  $project: {
                    name: 1,
                    categoryId: 1,
                    specification: 1,
                    description: 1,
                    discount: 1,
                    hasDiscount: 1,
                    tags: 1,
                  },
                },
              ], // ← also grab category_id
            },
          },
          {
            $addFields: {
              productName: {
                $ifNull: [
                  { $arrayElemAt: ["$_product.name", 0] },
                  "Unknown Product",
                ],
              },
              specification: { $arrayElemAt: ["$_product.specification", 0] },
              categoryId: { $arrayElemAt: ["$_product.categoryId", 0] }, // ← flatten it out
              description: { $arrayElemAt: ["$_product.description", 0] },
              hasDiscount: { $arrayElemAt: ["$_product.hasDiscount", 0] },
              tags: { $arrayElemAt: ["$_product.tags", 0] },
              discount: { $arrayElemAt: ["$_product.discount", 0] },
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "categoryId",
              foreignField: "_id",
              as: "_categoryDoc",
              pipeline: [{ $project: { name: 1, slug: 1, path: 1 } }],
            },
          },
          {
            $addFields: {
              _categoryDoc: { $arrayElemAt: ["$_categoryDoc", 0] },
            },
          },
          {
            $addFields: {
              // root → ... → leaf, as an array of ObjectIds
              _categoryChain: {
                $concatArrays: [
                  { $ifNull: ["$_categoryDoc.path", []] },
                  {
                    $cond: [
                      { $ifNull: ["$_categoryDoc._id", false] },
                      ["$_categoryDoc._id"],
                      [],
                    ],
                  },
                ],
              },
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "_categoryChain",
              foreignField: "_id",
              as: "_categoryChainDocs",
              pipeline: [{ $project: { name: 1 } }],
            },
          },
          {
            $addFields: {
              // re-order by walking _categoryChain (the correct order), not _categoryChainDocs (arbitrary order)
              categoryPath: {
                $map: {
                  input: "$_categoryChain",
                  as: "id",
                  in: {
                    $let: {
                      vars: {
                        matched: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$_categoryChainDocs",
                                as: "c",
                                cond: { $eq: ["$$c._id", "$$id"] },
                              },
                            },
                            0,
                          ],
                        },
                      },
                      in: "$$matched.name",
                    },
                  },
                },
              },
            },
          },
          {
            $addFields: {
              categoryBreadcrumb: {
                $reduce: {
                  input: "$categoryPath",
                  initialValue: "",
                  in: {
                    $cond: [
                      { $eq: ["$$value", ""] },
                      "$$this",
                      { $concat: ["$$value", " => ", "$$this"] },
                    ],
                  },
                },
              },
              categoryName: {
                $ifNull: ["$_categoryDoc.name", "Uncategorized"],
              }, // leaf name only, unchanged behavior
              categorySlug: "$_categoryDoc.slug",
            },
          },
          {
            $addFields: {
              color: {
                /* unchanged */
                $getField: {
                  field: "value",
                  input: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$attributes",
                          as: "a",
                          cond: { $eq: ["$$a.key", "color"] },
                        },
                      },
                      0,
                    ],
                  },
                },
              },
              size: {
                /* unchanged */
                $getField: {
                  field: "value",
                  input: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$attributes",
                          as: "a",
                          cond: { $eq: ["$$a.key", "size"] },
                        },
                      },
                      0,
                    ],
                  },
                },
              },
            },
          },
          {
            $project: {
              _id: 1,
              productId: 1,
              sellerId: 1,
              categoryId: 1, // ← add
              categoryName: 1, // ← add
              categorySlug: 1, // ← add
              categoryPath: 1, // ["Men", "Shirt"]
              categoryBreadcrumb: 1,
              sku: 1,
              image: 1,
              buyingPrice: 1,
              sellingPrice: 1,
              profit: 1,
              profit_margin: 1,
              stock: 1,
              lowStockAlert: 1,
              isActive: 1,
              productName: 1,
              color: 1,
              size: 1,
              specification: 1,
              description: 1,
              discount: 1,
              hasDiscount: 1,
              tags: 1,
            },
          },
        ],
      },
    },
  ]);

  const stats = result.stats[0] ?? {
    totalProduct: 0,
    outOfStock: 0,
    lowStock: 0,
    reminderStock: 0,
  };
  const total = result.total[0]?.count ?? 0;
  const products = result.data;
  const data = {
    products,
    totalProduct: stats.totalProduct,
    outOfStock: stats.outOfStock,
    lowStock: stats.lowStock,
    reminderStock: stats.reminderStock,
  };
  return { data, total, query };
};

export const editProductVariant = async (req: Request) => {
  const input = req.body;
  const sellerId = req.user.sellerId;
  const userId = req.user._id;
  if (!sellerId) {
    throw new AppError("sellerId not found", 400);
  }
  const { variantId, sellingPrice, newImage, previousImage, alertStock } =
    input as EditProductVariantInput;

  const existing = await ProductVariant.findOne({
    sellerId: sellerId,
    _id: new Types.ObjectId(variantId),
  });
  if (!existing) {
    throw new AppError("Product variant not found");
  }
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const updateVariant = await ProductVariant.findOneAndUpdate(
      {
        sellerId: sellerId,
        _id: existing._id,
      },
      {
        $set: {
          sellingPrice: sellingPrice ? sellingPrice : existing.sellingPrice,
          lowStockAlert: alertStock ? alertStock : existing.lowStockAlert,
          image: newImage ? newImage : existing.image,
        },
      },
      { session, returnDocument: "after", runValidators: true },
    );
    if (!updateVariant) {
      throw new AppError("Failed to edit product variant");
    }

    const editProduct = await Product.findOneAndUpdate(
      { sellerId: sellerId, _id: existing.productId },
      [
        {
          $set: {
            ...(newImage && {
              images: {
                $concatArrays: [
                  {
                    $filter: {
                      input: "$images",
                      as: "img",
                      cond: { $ne: ["$$img", existing.image] },
                    },
                  },
                  [newImage],
                ],
              },
            }),
            display_price_max: {
              $cond: {
                if: { $gte: ["$display_price_max", sellingPrice] },
                then: "$display_price_max",
                else: sellingPrice,
              },
            },
            display_price_min: {
              $min: ["$display_price_min", sellingPrice],
            },
          },
        },
      ],
      {
        session,
        returnDocument: "after",
        runValidators: true,
        updatePipeline: true,
      },
    );
    await session.commitTransaction();
    return updateVariant;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};
