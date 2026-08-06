import { Request, Response } from "express";
import * as PublicService from "./public.service";
import { GetProductQuery } from "../product/product.validation";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { GetProductQueryInput } from "./public.validation";
import { ProductsByCategorySlugQuery } from "./public.interface";

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as GetProductQueryInput;

  const { products, total } = await PublicService.getProducts(query);

  return ApiResponse.paginated(
    res,
    "Product",
    products,
    total,
    query.page,
    query.limit,
  );
});

export const getAllCategories = async (req: Request, res: Response) => {
  const categories = await PublicService.getAllCategories(req);
  return ApiResponse.success(
    res,
    categories,
    "Categories retrieved successfully",
  );
};
export const getCategoryTree = asyncHandler(
  async (req: Request, res: Response) => {
    const search = req.query.search as string | undefined;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { categories, total } = await PublicService.searchCategories({
      ...(search && { search }),
      skip,
      limit,
    });

    return ApiResponse.paginated(
      res,
      "successfully",
      categories,
      total,
      page,
      limit,
    );
  },
);


export const getPublicMergedCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const search = req.query.search as string | undefined;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { categories, total } = await PublicService.getPublicMergedCategories(
      {
        ...(search && { search }),
        page,
        limit,
      },
    );

    return ApiResponse.paginated(
      res,
      "successfully",
      categories,
      total,
      page,
      limit,
    );
  },
);

