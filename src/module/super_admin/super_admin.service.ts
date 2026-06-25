import mongoose from "mongoose";
import { ParsedQs } from "qs";
import { AppError } from "../../middlewares/appError";
import User from "./super_admin.schema";
import { IUserDocument } from "./super_admin.interface";
import {
  CreateNewCompanyInput,
  CreateUserInput,
} from "./super_admin.validation";
import { ITokenPayload } from "../../utils/jwtHelper";
import Company from "../company/company.schema";
import { Request } from "express";
import { ICompanyDocument } from "../company/company.interface";
import { auditLog } from "../../utils/auditLogger";
import { AUDIT_ACTIONS } from "../audit/audit.interface";
import {
  CompanyQueryInput,
  UpdateCompanyInput,
} from "../company/company.validation";
import Session from "../auth/auth.schema";
import { sanitizeData } from "../../utils/sanitizeData";

// ─── Types ────────────────────────────────────────────────

interface ListQuery extends ParsedQs {
  page?: string;
  limit?: string;
  company_id?: string;
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
const createUser = async (
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
    company_id: input.company_id
      ? new mongoose.Types.ObjectId(input.company_id)
      : null,
    createdBy,
  });

  return user.toJSON();
};

// ─── getUserById ──────────────────────────────────────────
const getUserById = async (id: string) => {
  assertValidObjectId(id, "user ID");

  const user = await User.findById(id).lean();
  if (!user) throw new AppError("User not found", 404);

  return user;
};

// ─── listUsers ────────────────────────────────────────────
// Accepts raw req.query — parsing and sanitisation happens here, not in the controller.
const listUsers = async (rawQuery: ListQuery): Promise<ListResult> => {
  const page = Math.max(1, parseInt(rawQuery.page ?? "1", 10));
  const limit = Math.min(100, parseInt(rawQuery.limit ?? "10", 10));
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};

  if (rawQuery.company_id) {
    assertValidObjectId(rawQuery.company_id, "company_id");
    filter.company_id = new mongoose.Types.ObjectId(rawQuery.company_id);
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
const deleteUser = async (id: string, requestor: ITokenPayload) => {
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
    !target.company_id?.equals(requestor.company_id as mongoose.Types.ObjectId)
  ) {
    throw new AppError("You can only delete users within your company", 403);
  }

  await target.deleteOne();
};

// ─── toggleUserStatus ─────────────────────────────────────
// Flips is_active. Same scope rules as deleteUser.
const toggleUserStatus = async (id: string, requestor: ITokenPayload) => {
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
    !target.company_id?.equals(requestor.company_id as mongoose.Types.ObjectId)
  ) {
    throw new AppError("You can only manage users within your company", 403);
  }

  target.is_active = !target.is_active;
  await target.save();

  return target.toJSON();
};

// create company

const createCompany = async (payload: CreateNewCompanyInput, req: Request) => {
  const {
    company_email,
    company_name,
    address,
    password,
    phone,
    status,
    logo,
    domain,
    subdomain,
  } = payload;

  // ── 1. duplicate checks in parallel ────────────────────
  const [existingCompany, existingAdmin] = await Promise.all([
    Company.findOne({ company_email: company_email }).lean(), // ← lean() — no mongoose doc overhead
    User.findOne({ email: company_email }).lean(),
  ]);

  if (existingCompany)
    throw new AppError("Company email already registered", 409);
  if (existingAdmin) throw new AppError("Admin email already registered", 409);

  // ── 2. pre-generate IDs ─────────────────────────────────
  // Generate both IDs before transaction starts
  // This lets us set admin_id on company at creation time
  // Eliminates the extra findByIdAndUpdate inside transaction
  const companyId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();
  console.log(companyId, adminId);
  const session = await mongoose.startSession();
  let newCompany: ICompanyDocument;
  let newAdmin: IUserDocument;

  try {
    session.startTransaction();

    // ── 3. create BOTH in parallel ──────────────────────────
    // company and admin have no dependency on each other now
    // because we pre-generated the IDs
    const [companies, admins] = await Promise.all([
      Company.create(
        [
          {
            _id: companyId,
            company_name: company_name,
            company_email: company_email,
            companyNavName:company_name,
            phone: phone,
            address: address,
            admin_id: adminId, // ← set directly, no update needed
            createdBy: req.user._id,
            status: status,
            ...(logo && { logo: logo }),
            ...(domain && { domain: domain }),
            ...(subdomain && { subdomain: subdomain }),
          },
        ],
        { session },
      ),
      User.create(
        [
          {
            _id: adminId,
            name: company_name,
            email: company_email,
            password: password,
            role: "admin",
            company_id: companyId, // ← set directly
            createdBy: req.user._id,
          },
        ],
        { session },
      ),
    ]);

    const createdCompany = companies[0];
    const createdAdmin = admins[0];

    if (!createdCompany) throw new AppError("Failed to create company", 500);
    if (!createdAdmin) throw new AppError("Failed to create admin", 500);

    newCompany = createdCompany;
    newAdmin = createdAdmin;

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }

  // ── 4. audit log — fire and forget ─────────────────────
  auditLog({
    req,
    action: AUDIT_ACTIONS.COMPANY_CREATED,
    targetModel: "Company",
    targetId: newCompany._id,
    after: {
      company_name: newCompany.company_name,
      company_email: newCompany.company_email,
      admin_email: newAdmin.email,
      admin_id: newAdmin._id,
    },
  });

  return {
    company: newCompany,
    admin: newAdmin.toJSON(),
  };
};

const getAllCompanies = async (query: CompanyQueryInput) => {
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
    Company.countDocuments(filter),
    Company.find(filter)
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

const getCompanyById = async (companyId: string, req: Request) => {
  const filter: Record<string, unknown> = {
    _id: new mongoose.Types.ObjectId(companyId),
  };

  // admin can only see their own company
  if (req.user.role === "admin") {
    filter._id = req.user.company_id;
  }

  const company = await Company.findOne(filter)
    .populate("admin_id", "name email role")
    .populate("createdBy", "name email")
    .lean();

  if (!company) throw new AppError("Company not found", 404);

  return company;
};

const updateCompany = async (
  companyId: string,
  payload: UpdateCompanyInput,
  req: Request,
) => {
  const company = await Company.findById(companyId);
  if (!company) throw new AppError("Company not found", 404);

  const [domainTaken, subdomainTaken] = await Promise.all([
    payload.domain && payload.domain !== company.domain
      ? Company.findOne({ domain: payload.domain }).lean()
      : null,
    payload.subdomain && payload.subdomain !== company.subdomain
      ? Company.findOne({ subdomain: payload.subdomain }).lean()
      : null,
  ]);
  if (domainTaken) throw new AppError("Domain already taken", 409);
  if (subdomainTaken) throw new AppError("Subdomain already taken", 409);

  // ── snapshot before state for audit ────────────────────
  const before = {
    company_name: company.company_name,
    phone: company.phone,
    address: company.address,
    status: company.status,
    domain: company.domain,
    subdomain: company.subdomain,
  };

  // ── build update — only include provided fields ─────────
  const updateData = sanitizeData(payload);
  const updated = await Company.findByIdAndUpdate(
    companyId,
    { $set: updateData },
    { new: true, runValidators: true },
  );

  if (!updated) throw new AppError("Company update failed", 500);

  // ── audit ───────────────────────────────────────────────
  auditLog({
    req,
    action: AUDIT_ACTIONS.COMPANY_UPDATED,
    targetModel: "Company",
    targetId: updated._id,
    before,
    after: {
      company_name: updated.company_name,
      phone: updated.phone,
      address: updated.address,
      status: updated.status,
      domain: updated.domain,
      subdomain: updated.subdomain,
    },
  });

  return updated;
};

const deleteCompany = async (companyId: string, req: Request) => {
  const company = await Company.findById(companyId);
  if (!company) throw new AppError("Company not found", 404);

  // snapshot for audit before deletion
  const snapshot = {
    company_name: company.company_name,
    company_email: company.company_email,
    status: company.status,
  };

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // ── find all users in this company ──────────────────
    const companyUsers = await User.find(
      { company_id: company._id },
      { _id: 1 },
    ).lean();

    const userIds = companyUsers.map((u) => u._id);

    // ── delete everything in parallel ───────────────────
    await Promise.all([
      Company.findByIdAndDelete(companyId, { session }),

      // delete all users of this company
      User.deleteMany({ company_id: company._id }, { session }),

      // delete all sessions of those users
      Session.deleteMany({ userId: { $in: userIds } }, { session }),
    ]);

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }

  // ── audit ──────────────────────────────────────────────
  auditLog({
    req,
    action: AUDIT_ACTIONS.COMPANY_DELETED,
    targetModel: "Company",
    targetId: company._id,
    before: snapshot,
    after: null,
  });
};

export const UserService = {
  createUser,
  getUserById,
  listUsers,
  deleteUser,
  toggleUserStatus,
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
};
