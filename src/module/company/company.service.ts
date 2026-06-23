import mongoose, { Types } from "mongoose";
import { AppError } from "../../middlewares/appError";
import User from "../super_admin/super_admin.schema";
import { ICompanyDocument } from "./company.interface";
import Company from "./company.schema";
import {
  CompanyUserInput,
  UpdateCompanyInput,
  UpdateSocialMediaInput,
  UpdateUserInput,
  UserQueryInput,
} from "./company.validation";
import { Request } from "express";
import { auditLog } from "../../utils/auditLogger";
import { AUDIT_ACTIONS } from "../audit/audit.interface";
import { sanitizeData } from "../../utils/sanitizeData";
import Session from "../auth/auth.schema";
import { TCreateNavItem } from "./company.header.validation";
import { NavConfig } from "./company.header.schema";

const ADMIN_ROLES = [
  "account",
  "site_management",
  "inventory",
  "sales",
  "report",
] as const;
const SUPER_ADMIN_ROLES = ["admin", ...ADMIN_ROLES] as const;

const targetFinder = async (userId: string, req: Request, action: string) => {
  const filter: Record<string, unknown> = {
    _id: new mongoose.Types.ObjectId(userId),
  };
  if (req.user.role === "admin") {
    filter.company_id = req.user.company_id;
  }

  const target = await User.findOne(filter).lean();
  if (!target) {
    throw new AppError("Target user not found", 404);
  }

  if (target._id.equals(req.user._id)) {
    throw new AppError(`You cannot ${action} your own account`, 400);
  }

  if (target.role === "super_admin") {
    throw new AppError(`super_admin accounts cannot be ${action}`, 403);
  }

  if (target.role === "admin" && req.user.role === "admin") {
    throw new AppError(`Admin cannot ${action} another admin`, 403);
  }
  return target;
};

const createCompanyUser = async (payload: CompanyUserInput, req: Request) => {
  const { companyId, name, email, role, password } = payload;
  const isSuperAdmin = req.user.role === "super_admin";

  if (isSuperAdmin) {
    if (!companyId) {
      throw new AppError("Company Id is required for Super Admin", 400);
    }
    if (!(SUPER_ADMIN_ROLES as readonly string[]).includes(role)) {
      throw new AppError(`Invalid role: ${role}`, 403);
    }
  } else {
    if (!(ADMIN_ROLES as readonly string[]).includes(role)) {
      throw new AppError(`Admin cannot assign role: ${role}`, 403);
    }
  }
  let companyIdToUse: mongoose.Types.ObjectId;

  if (isSuperAdmin) {
    const [existing, company] = await Promise.all([
      User.findOne({ email }).select("_id").lean(),
      Company.findById(companyId).select("_id status").lean(),
    ]);
    if (existing) throw new AppError("Email already registered", 409);
    if (!company) {
      throw new AppError("Company not found", 404);
    }
    if (company.status !== "active") {
      throw new AppError("Cannot create user for an inactive company", 400);
    }
    companyIdToUse = company._id;
  } else {
    if (!req.user.company_id) throw new AppError("Company not found", 404);

    const existing = await User.findOne({ email }).select("_id").lean();
    if (existing) throw new AppError("Email already registered", 409);

    companyIdToUse = new mongoose.Types.ObjectId(
      req.user.company_id.toString(),
    );
  }
  const user = await User.create({
    name,
    email,
    password,
    role,
    createdBy: req.user._id,
    company_id: companyIdToUse,
  });

  auditLog({
    req,
    action: AUDIT_ACTIONS.USER_CREATED,
    targetModel: "User",
    targetId: user._id,
    after: {
      name: user.name,
      email: user.email,
      role: user.role,
      company_id: user.company_id,
      is_active: user.is_active,
    },
  });
  return user.toJSON();
};

const getAllUsers = async (query: UserQueryInput, req: Request) => {
  const {
    page,
    limit,
    search,
    role,
    is_active,
    sortBy,
    sortOrder,
    company_id,
  } = query;

  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {};
  if (req.user.role === "admin") {
    filter.company_id = req.user.company_id;
    filter.role = {
      $in: ["account", "site_management", "inventory", "sales", "report"],
    };
  } else {
    if (company_id) filter.company_id = new mongoose.Types.ObjectId(company_id);
  }
  if (role) filter.role = role;
  if (is_active) filter.is_active = is_active;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  const [total, user] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .select("-password -reset_token -reset_token_exp")
      .populate("company_id", "company_name company_email status")
      .populate("createdBy", "name email")
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy ?? "createdAt"]: sortOrder ?? -1 })
      .lean(),
  ]);
  return {
    user,
    page,
    limit,
    total,
  };
};

const getUserById = async (userId: string, req: Request) => {
  const filter: Record<string, unknown> = {
    _id: new mongoose.Types.ObjectId(userId),
  };

  // admin can only see users in their own company
  if (req.user.role === "admin") {
    filter.company_id = req.user.company_id;
  }
  const user = await User.findOne(filter)
    .select("-password -reset_token -reset_token_exp")
    .populate("company_id", "company_name company_email status")
    .populate("createdBy", "name email")
    .lean();

  if (!user) throw new AppError("Single user not found", 404);

  return user;
};

const updateUser = async (
  userId: string,
  payload: UpdateUserInput,
  req: Request,
) => {
  const target = await targetFinder(userId, req, "update");
  // if (payload.role && req.user.role === "admin") {
  //   throw new AppError("Admin cannot change user roles", 403);
  // }
  const before = {
    name: target.name,
    role: target.role,
    is_active: target.is_active,
  };
  const updateData: Record<string, unknown> = {};
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.role !== undefined) updateData.role = payload.role;
  if (payload.is_active !== undefined) updateData.is_active = payload.is_active;
  if (Object.keys(updateData).length === 0) {
    throw new AppError("No fields to update", 400);
  }
  const updated = await User.findByIdAndUpdate(
    userId,
    {
      $set: updateData,
    },
    { new: true, runValidators: true },
  ).select("-password -reset_token -reset_token_exp");

  if (!updated) throw new AppError("User update failed", 500);
  if (payload.is_active === false) {
    await Session.deleteMany({ userId: target._id });
  }

  auditLog({
    req,
    action: "USER_UPDATED",
    targetModel: "User",
    targetId: updated._id,
    before,
    after: {
      name: updated.name,
      role: updated.role,
      is_active: updated.is_active,
    },
  });
  return updated.toJSON();
};

const deleteUser = async (userId: string, req: Request) => {
  const target = await targetFinder(userId, req, "delete");

  // snapshot for audit
  const snapshot = {
    name: target.name,
    email: target.email,
    role: target.role,
    company_id: target.company_id,
    is_active: target.is_active,
  };

  // ── delete user + their sessions in parallel ──────────
  await Promise.all([
    User.findByIdAndDelete(userId),
    Session.deleteMany({ userId: target._id }),
  ]);

  // ── audit ──────────────────────────────────────────────
  auditLog({
    req,
    action: AUDIT_ACTIONS.USER_DELETED,
    targetModel: "User",
    targetId: target._id,
    before: snapshot,
    after: null,
  });
};

const getMyCompany = async (id: Types.ObjectId) => {
  const result = await Company.findById(id);
  return result;
};

const updateMyCompany = async (
  companyId: Types.ObjectId,
  data: UpdateCompanyInput,
) => {
  const company = await Company.findById(companyId);
  if (!company) throw new AppError("Company not found", 404);

  // build update object — only include fields that were actually sent
  const update: Partial<UpdateCompanyInput> = {};

  if (data.company_name !== undefined) update.company_name = data.company_name;
  if (data.phone !== undefined) update.phone = data.phone;
  if (data.address !== undefined) update.address = data.address;

  // logo: only update if a non-empty URL was provided
  if (data.logo && data.logo.trim() !== "") {
    update.logo = data.logo;
  }

  const updated = await Company.findByIdAndUpdate(
    companyId,
    { $set: update },
    { new: true, runValidators: true },
  ).lean();

  return updated;
};

const updateSocialMedia = async (
  companyId: Types.ObjectId,
  data: UpdateSocialMediaInput,
) => {
  const company = await Company.findById(companyId);
  if (!company) throw new AppError("Company not found", 404);

  if (!data.social_media)
    throw new AppError("No social media data provided", 400);

  // build $set only for fields that were actually sent
  const socialUpdate: Record<string, string | null> = {};

  const fields = [
    "facebook",
    "instagram",
    "twitter",
    "youtube",
    "tiktok",
    "linkedin",
    "whatsapp",
    "pinterest",
    "website",
  ] as const;

  fields.forEach((field) => {
    const value = data.social_media?.[field];
    if (value !== undefined) {
      // store empty string as null
      socialUpdate[`social_media.${field}`] = value === "" ? null : value;
    }
  });

  const updated = await Company.findByIdAndUpdate(
    companyId,
    { $set: socialUpdate },
    { new: true, runValidators: true },
  ).lean();
  return updated;
};

const createHeaderNav = async (
  companyId: Types.ObjectId,
  input: TCreateNavItem,
) => {
  const { label } = input;
  const existing = await NavConfig.findOne({
    companyId,
    "navItems.label": label,
  });
  if (existing) {
    throw new AppError(`${label} is already exist in nav items.`);
  }

  const result = await NavConfig.findOneAndUpdate(
    {
      companyId,
    },
    {
      $push: {
        navItems: input,
      },
    },
    {
      new: true,
      upsert: true,
    },
  );
  console.log(result)
  if (!result) {
    throw new AppError(`Failed to create this ${label} nav`);
  }
  return result;
};

const getHeaderNav = async (companyId: Types.ObjectId) => {
  const navItems = await NavConfig.findOne({
    companyId,
  }).lean();

  if (!navItems) {
    return [];
  }
  return navItems;
};

export const CompanyServices = {
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
};
