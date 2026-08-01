// src/module/product/product.controller.ts
import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import * as ProductService from "./product.service";
import mongoose from "mongoose";
import { CreateProductInput, createProductSchema, GetProductViewQuery } from "./product.validation";
import { AppError } from "../../middlewares/appError";
import { ProductTag, ProductType } from "./product.interface";

// ═══════════════════════════════════════════════════════════
// PRODUCT
// ═══════════════════════════════════════════════════════════

export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createProductSchema.parse(req.body);

    // Populated by auth middleware — same pattern as your existing `getMe`
    // endpoint (role-based access, field-level selection).
    const sellerId = req.user?.sellerId;
    const userId = req.user?._id;

    if (!sellerId || !userId) {
      throw new AppError("Only authenticated sellers can create products", 403);
    }

    const product = await ProductService.createProduct(
      { sellerId, createdBy: userId },
      input,
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  },
);

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as {
    page: number;
    limit: number;
    search?: string;
    category_id?: string;
    // vendor_id?: string;
    hasVariants?: boolean;
    isActive?: boolean;
    low_stock?: string;
    sortBy: string;
    sortOrder: string;
    productType: ProductType;
    sellingPrice: string;
    tags: ProductTag;
    discount: number;
    hasDiscount: boolean;
  };
  console.log("product controller query", query);
  const { products, total } = await ProductService.getProducts({
    sellerId: req.user.sellerId!,
    ...query,
  });

  return ApiResponse.paginated(
    res,
    "Product",
    products,
    total,
    query.page,
    query.limit,
  );
});

export const getProductById = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await ProductService.getProductById({
      id: req.params.id as string,
      sellerId: req.user.sellerId!,
    });

    return ApiResponse.success(res, result);
  },
);
export const getProductBySlug = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await ProductService.getProductBySlug({
      slug: req.params.slug as string,
      // sellerId: req.user.sellerId!,
    });

    return ApiResponse.success(res, result);
  },
);

export const updateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await ProductService.updateProduct({
      id: req.params.id as string,
      sellerId: req.user.sellerId!,
      data: req.body,
      req,
    });

    return ApiResponse.success(res, product, "Product updated successfully");
  },
);

export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await ProductService.deleteProduct({
      id: req.params.id as string,
      sellerId: req.user.sellerId!,
      req,
    });

    return ApiResponse.success(res, null, "Product deactivated successfully");
  },
);
export const getProductView = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await ProductService.getProductView(req.validatedQuery as GetProductViewQuery);

    return ApiResponse.success(
      res,
      product,
      "Product details fetch successfully",
    );
  },
);

// ═══════════════════════════════════════════════════════════
// VARIANT
// ═══════════════════════════════════════════════════════════
