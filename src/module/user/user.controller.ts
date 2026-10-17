import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as UserService from "./user.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { AppError } from "../../middlewares/appError";
import { CompanyQueryInput } from "../seller/seller.validation";
import { UserDetailsParams, UserStatsInput } from "./user.validation";

// ─── POST /users ──────────────────────────────────────────
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserService.createUser(req.body);

  return ApiResponse.created(res, user, "User created successfully");
});

// ─── GET /users/:id ───────────────────────────────────────
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = await UserService.getUserById(id);

  return ApiResponse.success(res, user);
});

// ─── GET /users ───────────────────────────────────────────
export const list = asyncHandler(async (req: Request, res: Response) => {
  const { users, total, page, limit } = await UserService.listUsers(req.query);

  return ApiResponse.paginated(
    res,
    "User list fetch successfully",
    users,
    total,
    page,
    limit,
  );
});

// ─── DELETE /users/:id ────────────────────────────────────
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const requestor = req.user!;

  if (requestor.role !== "super_admin" && requestor.role !== "admin") {
    throw new AppError("You do not have permission to delete users", 403);
  }

  await UserService.deleteUser(id, requestor);

  return ApiResponse.success(res, null, "User deleted successfully");
});

// ─── PATCH /users/:id/status ──────────────────────────────
export const toggleStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const user = await UserService.toggleUserStatus(id, req.user!);

    return ApiResponse.success(res, user, "User status updated");
  },
);
// create company

export const createCompany = asyncHandler(
  async (req: Request, res: Response) => {
    const company = await UserService.createCompany(req.body, req);

    return ApiResponse.created(res, company, "Company created successfully");
  },
);

export const getAllCompanies = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await UserService.getAllCompanies(
      req.validatedQuery as CompanyQueryInput,
    );
    return ApiResponse.success(res, result, "Companies fetched successfully");
  },
);
export const getUserStats = asyncHandler(
  async (req: Request, res: Response) => {
    const { stats, users, total, page, limit } = await UserService.getUserStats(
      req.validatedQuery as UserStatsInput,
    );
    return ApiResponse.paginated(
      res,
      "users stats fetched successfully",
      users,
      total,
      page,
      limit,
      { stats },
    );
  },
);

export const getCompanyById = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await UserService.getCompanyById(
      req.params.id as string,
      req,
    );
    return ApiResponse.success(res, result, "Company fetched successfully");
  },
);

export const updateCompany = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await UserService.updateCompany(
      req.params.id as string,
      req.body,
      req,
    );
    return ApiResponse.success(res, result, "Company updated successfully");
  },
);

export const deleteCompany = asyncHandler(
  async (req: Request, res: Response) => {
    await UserService.deleteCompany(req.params.id as string, req);
    return ApiResponse.success(res, null, "Company deleted successfully");
  },
);

export const createSuperAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await UserService.createSuperAdmin(req.body);
    return ApiResponse.created(res, result, "Super admin created successfully");
  },
);

export const getUserDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await UserService.getUserDetails(
      req.validatedQuery as UserDetailsParams,
    );
    return ApiResponse.success(
      res,
      result,
      "User details fetched successfully",
    );
  },
);
