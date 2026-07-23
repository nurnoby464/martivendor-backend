// src/module/product/product.controller.ts
import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import * as ProductService from "./product.service";
import mongoose from "mongoose";
import { CreateProductInput } from "./product.validation";

// ═══════════════════════════════════════════════════════════
// PRODUCT
// ═══════════════════════════════════════════════════════════



export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as {
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
  };

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

// ═══════════════════════════════════════════════════════════
// VARIANT
// ═══════════════════════════════════════════════════════════


