import express from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { CompanyServices } from "./company.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { UpdateSocialMediaInput, UserQueryInput } from "./company.validation";
import { Types } from "mongoose";
import { TDeleteNavItem } from "./company.header.validation";

const createCompanyUser: express.RequestHandler = asyncHandler(
  async (req, res) => {
    const user = await CompanyServices.createCompanyUser(req.body, req);
    return ApiResponse.created(res, user, "Company user created successfully");
  },
);

const getAllUsers: express.RequestHandler = asyncHandler(async (req, res) => {
  const { user, page, limit, total } = await CompanyServices.getAllUsers(
    req.validatedQuery as UserQueryInput,
    req,
  );
  return ApiResponse.paginated(
    res,
    "User fetch successfully",
    user,
    total,
    page,
    limit,
  );
  // return ApiResponse.success(res, result, "Users fetched successfully");
});

const getUserById: express.RequestHandler = asyncHandler(async (req, res) => {
  const result = await CompanyServices.getUserById(
    req.params.id as string,
    req,
  );
  return ApiResponse.success(res, result, "User fetched successfully");
});

const updateUser: express.RequestHandler = asyncHandler(async (req, res) => {
  const result = await CompanyServices.updateUser(
    req.params.id as string,
    req.body,
    req,
  );
  return ApiResponse.success(res, result, "User updated successfully");
});

const deleteUser: express.RequestHandler = asyncHandler(async (req, res) => {
  await CompanyServices.deleteUser(req.params.id as string, req);
  return ApiResponse.success(res, null, "User deleted successfully");
});

const getMyCompany: express.RequestHandler = asyncHandler(async (req, res) => {
  const companyId = req.company?._id;
  if (!companyId) {
    return ApiResponse.error(res, "Company is required");
  }
  const result = await CompanyServices.getMyCompany(companyId);
  return ApiResponse.success(res, result, "My company info fetch successfully");
});

const updateMyCompany: express.RequestHandler = asyncHandler(
  async (req, res) => {
    const companyId = req.user.company_id;
    if (!companyId) {
      return ApiResponse.error(res, "Company is required");
    }
    const result = await CompanyServices.updateMyCompany(companyId, req.body);
    return ApiResponse.success(
      res,
      result,
      "My company info fetch successfully",
    );
  },
);

const updateSocialMedia: express.RequestHandler = asyncHandler(
  async (req, res) => {
    const companyId = req.user.company_id;
    if (!companyId) {
      return ApiResponse.error(res, "Failed, Company id is required");
    }
    const data = req.body as UpdateSocialMediaInput;

    const updated = await CompanyServices.updateSocialMedia(companyId, data);
    return ApiResponse.success(
      res,
      updated,
      "Social media updated successfully",
    );
  },
);

const createHeaderNav: express.RequestHandler = asyncHandler(
  async (req, res) => {
    const companyId = req.user.company_id;
    if (!companyId) {
      return ApiResponse.error(res, "Failed, Company id is required");
    }

    const result = await CompanyServices.createHeaderNav(companyId, req.body);
    return ApiResponse.created(res, result, "Nav items created successfully");
  },
);

const getHeaderNav: express.RequestHandler = asyncHandler(async (req, res) => {
  const companyId = req.company?._id;
  if (!companyId) {
    return ApiResponse.error(res, "Failed, Company id is required");
  }

  const result = await CompanyServices.getHeaderNav(companyId);
  return ApiResponse.success(res, result, "Nav items fetched successfully");
});

const reOrderHeaderNav: express.RequestHandler = asyncHandler(
  async (req, res) => {
    const companyId = req.user.company_id;
  
    if (!companyId) {
      return ApiResponse.error(res, "Failed, Company id is required");
    }
    const navConfigId = req.params.id as string;
    const result = await CompanyServices.reOrderHeaderNav(
      companyId,
      new Types.ObjectId(navConfigId),
      req.body,
    );
    return ApiResponse.success(res, result, "Nav items reorder successfully");
  },
);
const updateHeaderNav: express.RequestHandler = asyncHandler(
  async (req, res) => {
    const companyId = req.user.company_id;
    if (!companyId) {
      return ApiResponse.error(res, "Failed, Company id is required");
    }
    const navId = req.params.id as string;
    const result = await CompanyServices.updateHeaderNav(
      companyId,
      new Types.ObjectId(navId),
      req.body,
    );
    return ApiResponse.success(res, result, "Nav items deleted successfully");
  },
);
const deleteHeaderNav: express.RequestHandler = asyncHandler(
  async (req, res) => {
    const companyId = req.user.company_id;
    if (!companyId) {
      return ApiResponse.error(res, "Failed, Company id is required");
    }
    const payload: TDeleteNavItem = {
      id: req.params.id as string,
      navItemId: req.params.navItemId as string,
    };
    const result = await CompanyServices.deleteHeaderNav(companyId, payload);
    return ApiResponse.success(res, result, "Nav items deleted successfully");
  },
);

export const CompanyControllers = {
  createCompanyUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getMyCompany,
  updateMyCompany,
  updateSocialMedia,
  createHeaderNav,
  getHeaderNav,
  deleteHeaderNav,
  updateHeaderNav,
  reOrderHeaderNav,
};
