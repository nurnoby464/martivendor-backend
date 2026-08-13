import { asyncHandler } from "../../utils/asyncHandler";
import { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import * as ProductVariantServices from "./product-variant.service";
import mongoose from "mongoose";
import {
  CreateVariantInput,
  IMyInventoryQuery,
  UpdateVariantInput,
} from "./product-variant.validation";
import { AppError } from "../../middlewares/appError";

export const createVariant = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = new mongoose.Types.ObjectId(req.user.sellerId!);
    const variant = await ProductVariantServices.createVariant(
      {
        ...(req.body as CreateVariantInput),
        productId: req.params.id as string,
        sellerId,
      },
      req,
    );

    return ApiResponse.created(res, variant, "Variant created successfully");
  },
);

export const getVariants = asyncHandler(async (req: Request, res: Response) => {
  const variants = await ProductVariantServices.getVariants({
    productId: req.params.id as string,
    sellerId: req.user.sellerId!,
  });

  return ApiResponse.success(res, variants);
});
export const getVariantById = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = new mongoose.Types.ObjectId(req.user.sellerId!);
    const variant = await ProductVariantServices.getVariantById(
      req.params.variantId as string,
      sellerId,
    );

    ApiResponse.success(res, variant, "Variant fetched successfully");
  },
);

export const updateVariant = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = new mongoose.Types.ObjectId(req.user.sellerId!);
    const variant = await ProductVariantServices.updateVariant(
      req.params.variantId as string,
      sellerId,
      req.body as UpdateVariantInput,
      req,
    );
    return ApiResponse.success(res, variant, "Variant updated successfully");
  },
);

export const deleteVariant = asyncHandler(
  async (req: Request, res: Response) => {
    const variant = await ProductVariantServices.deleteVariant({
      id: req.params.variantId as string,
      productId: req.params.id as string,
      sellerId: req.user.sellerId!,
      req,
    });
    return ApiResponse.success(res, null, "Variant deactivated successfully");
  },
);

export const getAllProductWithVariant = asyncHandler(
  async (req: Request, res: Response) => {
    const { data, total, query } =
      await ProductVariantServices.getAllProductWithVariant({ req });
    return ApiResponse.paginated(
      res,
      "Get Product with variant successfully",
      data,
      total,
      query.page,
      query.limit,
    );
  },
);

export const editProductVariant = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await ProductVariantServices.editProductVariant(req);
    return ApiResponse.success(res, result, "Variant updated successfully");
  },
);
export const getMyInventory = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = req.user.sellerId;
    if (!sellerId) {
      throw new AppError("unauthorized access. You have't seller Id", 403);
    }
    const { data, page, limit, totalCount } =
      await ProductVariantServices.getMyInventory(
        sellerId,
        req.validatedQuery as IMyInventoryQuery,
      );
    return ApiResponse.paginated(
      res,
      "My inventory get  successfully",
      data,
      totalCount,
      page,
      limit,
    );
  },
);
