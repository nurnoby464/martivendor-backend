import { Request, Response } from "express";
import * as PublicService from "./public.service";
import { GetProductQuery, GetProductViewQuery } from "../product/product.validation";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  GetProductQueryInput,
  SuggestionsSchemaQuery,
} from "./public.validation";
import { ProductsByCategorySlugQuery } from "./public.interface";

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as GetProductQueryInput;

  const { products, total, categories } =
    await PublicService.getProducts(query);

  return ApiResponse.paginated(
    res,
    "Product",
    products,
    total,
    query.page,
    query.limit,
    { categories },
  );
});

export const getProductFilterCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const query = req.validatedQuery as GetProductQueryInput;

    const categories = await PublicService.getProductFilterCategories(query);

    return ApiResponse.success(
      res,
      categories,
      "Product filer categories fetched successfully",
    );
  },
);

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
export const getSuggestions = asyncHandler(
  async (req: Request, res: Response) => {
    const { search } = req.validatedQuery as SuggestionsSchemaQuery;

    const result = await PublicService.getSuggestions(search);

    return ApiResponse.success(res, result, "successfully");
  },
);

export const getProductBySlug = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await PublicService.getProductBySlug({
      slug: req.params.slug as string,
      // sellerId: req.user.sellerId!,
    });

    return ApiResponse.success(res, result);
  },
);

export const getProductForCart = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await PublicService.getProductForCart(req.validatedQuery as GetProductViewQuery);

    return ApiResponse.success(
      res,
      product,
      "Product details fetch successfully",
    );
  },
);
