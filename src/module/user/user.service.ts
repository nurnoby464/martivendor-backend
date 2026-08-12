import mongoose from "mongoose";
import { ParsedQs } from "qs";
import { AppError } from "../../middlewares/appError";
import User from "./user.schema";
import { IUserDocument } from "./user.interface";
import {
  CreateNewCompanyInput,
  CreateSuperAdminInput,
  CreateUserInput,
  UserDetailsParams,
  UserStatsInput,
} from "./user.validation";
import { ITokenPayload } from "../../utils/jwtHelper";
import { Request } from "express";
import { auditLog } from "../../utils/auditLogger";
import { AUDIT_ACTIONS } from "../audit/audit.interface";
import {
  CompanyQueryInput,
  UpdateCompanyInput,
} from "../seller/seller.validation";
import Session from "../auth/auth.schema";
import { sanitizeData } from "../../utils/sanitizeData";
import { Seller } from "../seller/seller.schema";
import { ISale } from "../../CRM/sales/sales.interface";
import { ISeller } from "../seller/seller.interface";
import { useSkip } from "../../utils/useSkip";
import { profileModelMap } from "../../utils/helper";

// ─── Types ────────────────────────────────────────────────

interface ListQuery extends ParsedQs {
  page?: string;
  limit?: string;
  sellerId?: string;
  role?: string;
  is_active?: string;
}

interface ListResult {
  users: Record<string, any>[];
  total: number;
  page: number;
  limit: number;
}

// ─── Helpers ──────────────────────────────────────────────

function assertValidObjectId(id: string, label = "ID") {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label}: "${id}"`, 400);
  }
}

// ─── createUser ───────────────────────────────────────────
export const createUser = async (
  input: CreateUserInput,
  createdBy: mongoose.Types.ObjectId | null,
) => {
  const existing = await User.findOne({ email: input.email }).lean();
  if (existing) {
    throw new AppError("Email already in use", 409);
  }

  const user = await User.create({
    name: input.name,
    email: input.email,
    password: input.password,
    role: input.role,
    sellerId: input.sellerId
      ? new mongoose.Types.ObjectId(input.sellerId)
      : null,
    createdBy,
  });

  return user.toJSON();
};

// ─── getUserById ──────────────────────────────────────────
export const getUserById = async (id: string) => {
  assertValidObjectId(id, "user ID");

  const user = await User.findById(id).lean();
  if (!user) throw new AppError("User not found", 404);

  return user;
};

// ─── listUsers ────────────────────────────────────────────
// Accepts raw req.query — parsing and sanitisation happens here, not in the controller.
export const listUsers = async (rawQuery: ListQuery): Promise<ListResult> => {
  const page = Math.max(1, parseInt(rawQuery.page ?? "1", 10));
  const limit = Math.min(100, parseInt(rawQuery.limit ?? "10", 10));
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};

  if (rawQuery.sellerId) {
    assertValidObjectId(rawQuery.sellerId, "sellerId");
    filter.sellerId = new mongoose.Types.ObjectId(rawQuery.sellerId);
  }

  if (rawQuery.role) filter.role = rawQuery.role;
  if (rawQuery.is_active) filter.is_active = rawQuery.is_active === "true";

  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return { users, total, page, limit };
};

// ─── deleteUser ───────────────────────────────────────────
// super_admin  → can delete anyone
// admin        → can only delete users inside their own company
export const deleteUser = async (id: string, requestor: ITokenPayload) => {
  assertValidObjectId(id, "user ID");

  const target = await User.findById(id);
  if (!target) throw new AppError("User not found", 404);

  // Prevent self-deletion
  if (target._id.equals(requestor._id)) {
    throw new AppError("You cannot delete your own account", 400);
  }

  // Prevent deleting another super_admin
  if (target.role === "super_admin") {
    throw new AppError("super_admin accounts cannot be deleted", 403);
  }

  // Admin scope check — admin can only delete users in their company
  if (
    requestor.role === "admin" &&
    !target.sellerId?.equals(requestor.sellerId as mongoose.Types.ObjectId)
  ) {
    throw new AppError("You can only delete users within your company", 403);
  }

  await target.deleteOne();
};

// ─── toggleUserStatus ─────────────────────────────────────
// Flips is_active. Same scope rules as deleteUser.
export const toggleUserStatus = async (
  id: string,
  requestor: ITokenPayload,
) => {
  assertValidObjectId(id, "user ID");

  const target = await User.findById(id);
  if (!target) throw new AppError("User not found", 404);

  if (target._id.equals(requestor._id)) {
    throw new AppError("You cannot change your own status", 400);
  }

  if (target.role === "super_admin") {
    throw new AppError("super_admin status cannot be changed", 403);
  }

  if (
    requestor.role === "admin" &&
    !target.sellerId?.equals(requestor.sellerId as mongoose.Types.ObjectId)
  ) {
    throw new AppError("You can only manage users within your company", 403);
  }

  target.isActive = !target.isActive;
  await target.save();

  return target.toJSON();
};

// create company

export const createCompany = async (
  payload: CreateNewCompanyInput,
  req: Request,
) => {
  // const {
  //   company_email,
  //   company_name,
  //   address,
  //   password,
  //   phone,
  //   status,
  //   logo,
  //   domain,
  //   subdomain,
  // } = payload;
  // // ── 1. duplicate checks in parallel ────────────────────
  // const [existingCompany, existingAdmin] = await Promise.all([
  //   Seller.findOne({ company_email: company_email }).lean(), // ← lean() — no mongoose doc overhead
  //   User.findOne({ email: company_email }).lean(),
  // ]);
  // if (existingCompany)
  //   throw new AppError("Company email already registered", 409);
  // if (existingAdmin) throw new AppError("Admin email already registered", 409);
  // // ── 2. pre-generate IDs ─────────────────────────────────
  // // Generate both IDs before transaction starts
  // // This lets us set admin_id on company at creation time
  // // Eliminates the extra findByIdAndUpdate inside transaction
  // const sellerId = new mongoose.Types.ObjectId();
  // const adminId = new mongoose.Types.ObjectId();
  // const session = await mongoose.startSession();
  // let newCompany: ISeller;
  // let newAdmin: IUserDocument;
  // try {
  //   session.startTransaction();
  //   // ── 3. create BOTH in parallel ──────────────────────────
  //   // company and admin have no dependency on each other now
  //   // because we pre-generated the IDs
  //   const [companies, admins] = await Promise.all([
  //     Seller.create(
  //       [
  //         {
  //           _id: sellerId,
  //           company_name: company_name,
  //           company_email: company_email,
  //           companyNavName:company_name,
  //           phone: phone,
  //           address: address,
  //           admin_id: adminId, // ← set directly, no update needed
  //           createdBy: req.user._id,
  //           status: status,
  //           ...(logo && { logo: logo }),
  //           ...(domain && { domain: domain }),
  //           ...(subdomain && { subdomain: subdomain }),
  //         },
  //       ],
  //       { session },
  //     ),
  //     User.create(
  //       [
  //         {
  //           _id: adminId,
  //           name: company_name,
  //           email: company_email,
  //           password: password,
  //           role: "admin",
  //           sellerId: sellerId, // ← set directly
  //           createdBy: req.user._id,
  //         },
  //       ],
  //       { session },
  //     ),
  //   ]);
  //   const createdCompany = companies[0];
  //   const createdAdmin = admins[0];
  //   if (!createdCompany) throw new AppError("Failed to create company", 500);
  //   if (!createdAdmin) throw new AppError("Failed to create admin", 500);
  //   newCompany = createdCompany;
  //   newAdmin = createdAdmin;
  //   await session.commitTransaction();
  // } catch (err) {
  //   await session.abortTransaction();
  //   throw err;
  // } finally {
  //   await session.endSession();
  // }
  // // ── 4. audit log — fire and forget ─────────────────────
  // auditLog({
  //   req,
  //   action: AUDIT_ACTIONS.COMPANY_CREATED,
  //   targetModel: "Seller",
  //   targetId: newCompany._id,
  //   after: {
  //     company_name: newCompany.company_name,
  //     company_email: newCompany.company_email,
  //     admin_email: newAdmin.email,
  //     admin_id: newAdmin._id,
  //   },
  // });
  // return {
  //   company: newCompany,
  //   admin: newAdmin.toJSON(),
  // };
};

export const getAllCompanies = async (query: CompanyQueryInput) => {
  const { page, limit, search, status, sortOrder, sortBy } = query;
  const skip = (page - 1) * limit;
  // ── build filter ────────────────────────────────────────
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { company_name: { $regex: search, $options: "i" } },
      { company_email: { $regex: search, $options: "i" } },
    ];
  }

  // ── run count + data in parallel ────────────────────────
  const [total, companies] = await Promise.all([
    Seller.countDocuments(filter),
    Seller.find(filter)
      .populate("admin_id", "name email") // show admin name + email
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy ?? "createdAt"]: sortOrder ?? -1 }) // newest first
      .lean(),
  ]);

  return {
    companies,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};
export const getUserStats = async (query: UserStatsInput) => {
  const { page, limit, search, status, sortOrder, sortBy, role } = query;
  // ── build filter ────────────────────────────────────────
  const filter: Record<string, unknown> = {};
  if (search) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }
  if (role) {
    filter.role = role;
  }

  const [result, total] = await Promise.all([
    User.aggregate([
      {
        $facet: {
          stats: [
            {
              $group: {
                _id: "$role",
                userCount: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                role: "$_id",
                userCount: 1,
              },
            },
          ],
          users: [
            { $match: filter },
            { $sort: { [sortBy]: sortOrder } },
            { $skip: useSkip({ page, limit }) },
            { $limit: limit },
            {
              $lookup: {
                from: "sellers",
                localField: "profileId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      isPlatform: 1,
                      name: 1,
                      slug: 1,
                      image: 1,
                      status: 1,
                      banner: 1,
                      description: 1,
                    },
                  },
                ],
                as: "sellerProfile",
              },
            },
            {
              $lookup: {
                from: "customers",
                localField: "profileId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      email: 1,
                      phone: 1,
                      status: 1,
                    },
                  },
                ],
                as: "customerProfile",
              },
            },
            {
              $lookup: {
                from: "staffs",
                localField: "profileId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      email: 1,
                      phone: 1,
                      image: 1,
                      department: 1,
                      designation: 1,
                      isActive: 1,
                      status: 1,
                    },
                  },
                ],
                as: "staffProfile",
              },
            },
            {
              $lookup: {
                from: "sellerstaffs",
                localField: "profileId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      email: 1,
                      phone: 1,
                      image: 1,
                      department: 1,
                      designation: 1,
                      isActive: 1,
                      status: 1,
                    },
                  },
                ],
                as: "sellerStaffProfile",
              },
            },
            {
              $addFields: {
                profile: {
                  $switch: {
                    branches: [
                      {
                        case: { $eq: ["$profileType", "Seller"] },
                        then: { $arrayElemAt: ["$sellerProfile", 0] },
                      },
                      {
                        case: { $eq: ["$profileType", "Customer"] },
                        then: { $arrayElemAt: ["$customerProfile", 0] },
                      },
                      {
                        case: { $eq: ["$profileType", "Staff"] },
                        then: { $arrayElemAt: ["$staffProfile", 0] },
                      },
                      {
                        case: { $eq: ["$profileType", "SellerStaff"] },
                        then: { $arrayElemAt: ["$sellerStaffProfile", 0] },
                      },
                    ],
                    default: null,
                  },
                },
              },
            },

            {
              $project: {
                name: 1,
                email: 1,
                emailVerified: 1,
                profileId: 1,
                profileType: 1,
                phone: 1,
                role: 1,
                sellerId: 1,
                isActive: 1,
                lastLogin: 1,
                profile: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          stats: 1,
          users: 1,
        },
      },
    ]),
    User.countDocuments(filter),
  ]);

  const stats = result?.[0]?.stats;
  const users = result?.[0]?.users;

  return { stats, users, total, page, limit };
};

export const getCompanyById = async (sellerId: string, req: Request) => {
  const filter: Record<string, unknown> = {
    _id: new mongoose.Types.ObjectId(sellerId),
  };

  // admin can only see their own company
  if (req.user.role === "admin") {
    filter._id = req.user.sellerId;
  }

  const company = await Seller.findOne(filter)
    .populate("admin_id", "name email role")
    .populate("createdBy", "name email")
    .lean();

  if (!company) throw new AppError("Company not found", 404);

  return company;
};

export const updateCompany = async (
  sellerId: string,
  payload: UpdateCompanyInput,
  req: Request,
) => {
  // const company = await Seller.findById(sellerId);
  // if (!company) throw new AppError("Company not found", 404);
  // const [domainTaken, subdomainTaken] = await Promise.all([
  //   payload.domain && payload.domain !== company.domain
  //     ? Seller.findOne({ domain: payload.domain }).lean()
  //     : null,
  //   payload.subdomain && payload.subdomain !== company.subdomain
  //     ? Seller.findOne({ subdomain: payload.subdomain }).lean()
  //     : null,
  // ]);
  // if (domainTaken) throw new AppError("Domain already taken", 409);
  // if (subdomainTaken) throw new AppError("Subdomain already taken", 409);
  // // ── snapshot before state for audit ────────────────────
  // const before = {
  //   company_name: company.company_name,
  //   phone: company.phone,
  //   address: company.address,
  //   status: company.status,
  //   domain: company.domain,
  //   subdomain: company.subdomain,
  // };
  // // ── build update — only include provided fields ─────────
  // const updateData = sanitizeData(payload);
  // const updated = await Seller.findByIdAndUpdate(
  //   sellerId,
  //   { $set: updateData },
  //   { new: true, runValidators: true },
  // );
  // if (!updated) throw new AppError("Company update failed", 500);
  // // ── audit ───────────────────────────────────────────────
  // auditLog({
  //   req,
  //   action: AUDIT_ACTIONS.COMPANY_UPDATED,
  //   targetModel: "Seller",
  //   targetId: updated._id,
  //   before,
  //   after: {
  //     company_name: updated.company_name,
  //     phone: updated.phone,
  //     address: updated.address,
  //     status: updated.status,
  //     domain: updated.domain,
  //     subdomain: updated.subdomain,
  //   },
  // });
  // return updated;
};

export const deleteCompany = async (sellerId: string, req: Request) => {
  // const company = await Seller.findById(sellerId);
  // if (!company) throw new AppError("Company not found", 404);
  // // snapshot for audit before deletion
  // const snapshot = {
  //   company_name: company.company_name,
  //   company_email: company.company_email,
  //   status: company.status,
  // };
  // const session = await mongoose.startSession();
  // try {
  //   session.startTransaction();
  //   // ── find all users in this company ──────────────────
  //   const companyUsers = await User.find(
  //     { sellerId: company._id },
  //     { _id: 1 },
  //   ).lean();
  //   const userIds = companyUsers.map((u) => u._id);
  //   // ── delete everything in parallel ───────────────────
  //   await Promise.all([
  //     Seller.findByIdAndDelete(sellerId, { session }),
  //     // delete all users of this company
  //     User.deleteMany({ sellerId: company._id }, { session }),
  //     // delete all sessions of those users
  //     Session.deleteMany({ userId: { $in: userIds } }, { session }),
  //   ]);
  //   await session.commitTransaction();
  // } catch (err) {
  //   await session.abortTransaction();
  //   throw err;
  // } finally {
  //   await session.endSession();
  // }
  // // ── audit ──────────────────────────────────────────────
  // auditLog({
  //   req,
  //   action: AUDIT_ACTIONS.COMPANY_DELETED,
  //   targetModel: "Seller",
  //   targetId: company._id,
  //   before: snapshot,
  //   after: null,
  // });
};

export const createSuperAdmin = async (payload: CreateSuperAdminInput) => {
  const { name, phone, email, password, shopName } = payload;
  const slug = shopName
    .toLowerCase()
    .replace(/'/g, "") // Remove apostrophes
    .replace(/&/g, " ") // Replace & with space
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with -
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

  const [existingUser, existingPlatformSeller, existingSlug] =
    await Promise.all([
      User.findOne({ email }),
      Seller.findOne({ isPlatform: true }),
      Seller.findOne({ slug }),
    ]);

  if (existingUser) throw new AppError("This user already exists", 409);
  if (existingPlatformSeller)
    throw new AppError("Super admin already exists", 409);
  if (existingSlug)
    throw new AppError("Shop name is already taken, choose another", 409);
  const session = await mongoose.startSession();
  const id = new mongoose.Types.ObjectId();
  try {
    session.startTransaction();
    const [newUser] = await User.create(
      [
        {
          name,
          email,
          password,
          ...(phone !== undefined && { phone }),
          role: "super_admin",
          sellerId: id,
          profileId: id,
          profileType: "Seller",
        },
      ],
      { session },
    );
    if (!newUser) throw new AppError("super admin create failed", 400);
    const [newSeller] = await Seller.create(
      [
        {
          _id: id,
          userId: newUser._id,
          isPlatform: true,
          name: shopName,
          slug,
        },
      ],
      { session },
    );
    if (!newSeller) throw new AppError("seller crated failed", 400);
    await session.commitTransaction();
    return newUser;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};
export const getUserDetails = async (payload: UserDetailsParams) => {
  const { profileId, profileType } = payload;

  const ProfileModel = profileModelMap[profileType];
  const result = await ProfileModel.findById(profileId).lean();

  return result;
};
