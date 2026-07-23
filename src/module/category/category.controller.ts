// category.controller.ts
import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import * as CategoryService from "./category.service";

// ─── Create Category ──────────────────────────────────────
export const createCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const category = await CategoryService.createCategory({
      ...req.body, // Contains name, parent_id, image (URL)
      sellerId: req.user.sellerId!,
      createdBy: req.user._id,
      req,
    });
    return ApiResponse.created(res, category, "Category created successfully");
  },
);

// ─── Get Category Tree ────────────────────────────────────
export const getCategoryTree = asyncHandler(
  async (req: Request, res: Response) => {
    const search = req.query.search as string | undefined;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
console.log("sellerId",req.user.sellerId)
    const { categories, total } = await CategoryService.searchCategories({
      sellerId: req.user.sellerId!,
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

// ─── Get All Categories ───────────────────────────────────
export const getCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const page = req.validatedQuery.page as number;
    const limit = req.validatedQuery.limit as number;
    const search = req.validatedQuery.search as string;
    const parent_id = req.validatedQuery.parent_id as string;
    const depth = req.validatedQuery.depth as number;
    const is_active = req.validatedQuery.is_active as boolean;

    const query = { page, limit, search, parent_id, depth, is_active };
    const { categories, total } = await CategoryService.getCategories({
      sellerId: req.user.sellerId!,
      page,
      parent_id,
      depth,
      limit,
      search,
      is_active,
    });
    return ApiResponse.paginated(
      res,
      "Category",
      categories,
      total,
      query.page,
      query.limit,
    );
  },
);

// ─── Get Single Category ──────────────────────────────────
export const getCategoryById = asyncHandler(
  async (req: Request, res: Response) => {
    const category = await CategoryService.getCategoryById({
      id: req.params.id as string,
      sellerId: req.user.sellerId!,
    });
    return ApiResponse.success(res, category);
  },
);

// ─── Update Category ──────────────────────────────────────
export const updateCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const category = await CategoryService.updateCategory({
      id: req.params.id as string,
      sellerId: req.user.sellerId!,
      data: req.body, // Contains name, image (URL), is_active
      req,
    });
    return ApiResponse.success(res, category, "Category updated successfully");
  },
);

// ─── Delete Category ──────────────────────────────────────
export const deleteCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const category = await CategoryService.deleteCategory({
      id: req.params.id as string,
      sellerId: req.user.sellerId!,
      req,
    });
    return ApiResponse.success(res, null, "Category deactivated successfully");
  },
);
