"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const appError_1 = require("../../middlewares/appError");
const super_admin_schema_1 = __importDefault(require("./super_admin.schema"));
const company_schema_1 = __importDefault(require("../company/company.schema"));
const auditLogger_1 = require("../../utils/auditLogger");
const audit_interface_1 = require("../audit/audit.interface");
const auth_schema_1 = __importDefault(require("../auth/auth.schema"));
const sanitizeData_1 = require("../../utils/sanitizeData");
// ─── Helpers ──────────────────────────────────────────────
function assertValidObjectId(id, label = "ID") {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new appError_1.AppError(`Invalid ${label}: "${id}"`, 400);
    }
}
// ─── createUser ───────────────────────────────────────────
const createUser = async (input, createdBy) => {
    const existing = await super_admin_schema_1.default.findOne({ email: input.email }).lean();
    if (existing) {
        throw new appError_1.AppError("Email already in use", 409);
    }
    const user = await super_admin_schema_1.default.create({
        name: input.name,
        email: input.email,
        password: input.password,
        role: input.role,
        company_id: input.company_id
            ? new mongoose_1.default.Types.ObjectId(input.company_id)
            : null,
        createdBy,
    });
    return user.toJSON();
};
// ─── getUserById ──────────────────────────────────────────
const getUserById = async (id) => {
    assertValidObjectId(id, "user ID");
    const user = await super_admin_schema_1.default.findById(id).lean();
    if (!user)
        throw new appError_1.AppError("User not found", 404);
    return user;
};
// ─── listUsers ────────────────────────────────────────────
// Accepts raw req.query — parsing and sanitisation happens here, not in the controller.
const listUsers = async (rawQuery) => {
    const page = Math.max(1, parseInt(rawQuery.page ?? "1", 10));
    const limit = Math.min(100, parseInt(rawQuery.limit ?? "10", 10));
    const skip = (page - 1) * limit;
    const filter = {};
    if (rawQuery.company_id) {
        assertValidObjectId(rawQuery.company_id, "company_id");
        filter.company_id = new mongoose_1.default.Types.ObjectId(rawQuery.company_id);
    }
    if (rawQuery.role)
        filter.role = rawQuery.role;
    if (rawQuery.is_active)
        filter.is_active = rawQuery.is_active === "true";
    const [users, total] = await Promise.all([
        super_admin_schema_1.default.find(filter).skip(skip).limit(limit).lean(),
        super_admin_schema_1.default.countDocuments(filter),
    ]);
    return { users, total, page, limit };
};
// ─── deleteUser ───────────────────────────────────────────
// super_admin  → can delete anyone
// admin        → can only delete users inside their own company
const deleteUser = async (id, requestor) => {
    assertValidObjectId(id, "user ID");
    const target = await super_admin_schema_1.default.findById(id);
    if (!target)
        throw new appError_1.AppError("User not found", 404);
    // Prevent self-deletion
    if (target._id.equals(requestor._id)) {
        throw new appError_1.AppError("You cannot delete your own account", 400);
    }
    // Prevent deleting another super_admin
    if (target.role === "super_admin") {
        throw new appError_1.AppError("super_admin accounts cannot be deleted", 403);
    }
    // Admin scope check — admin can only delete users in their company
    if (requestor.role === "admin" &&
        !target.company_id?.equals(requestor.company_id)) {
        throw new appError_1.AppError("You can only delete users within your company", 403);
    }
    await target.deleteOne();
};
// ─── toggleUserStatus ─────────────────────────────────────
// Flips is_active. Same scope rules as deleteUser.
const toggleUserStatus = async (id, requestor) => {
    assertValidObjectId(id, "user ID");
    const target = await super_admin_schema_1.default.findById(id);
    if (!target)
        throw new appError_1.AppError("User not found", 404);
    if (target._id.equals(requestor._id)) {
        throw new appError_1.AppError("You cannot change your own status", 400);
    }
    if (target.role === "super_admin") {
        throw new appError_1.AppError("super_admin status cannot be changed", 403);
    }
    if (requestor.role === "admin" &&
        !target.company_id?.equals(requestor.company_id)) {
        throw new appError_1.AppError("You can only manage users within your company", 403);
    }
    target.is_active = !target.is_active;
    await target.save();
    return target.toJSON();
};
// create company
const createCompany = async (payload, req) => {
    const { company_email, company_name, address, password, phone, status, logo, domain, subdomain, } = payload;
    // ── 1. duplicate checks in parallel ────────────────────
    const [existingCompany, existingAdmin] = await Promise.all([
        company_schema_1.default.findOne({ company_email: company_email }).lean(), // ← lean() — no mongoose doc overhead
        super_admin_schema_1.default.findOne({ email: company_email }).lean(),
    ]);
    if (existingCompany)
        throw new appError_1.AppError("Company email already registered", 409);
    if (existingAdmin)
        throw new appError_1.AppError("Admin email already registered", 409);
    // ── 2. pre-generate IDs ─────────────────────────────────
    // Generate both IDs before transaction starts
    // This lets us set admin_id on company at creation time
    // Eliminates the extra findByIdAndUpdate inside transaction
    const companyId = new mongoose_1.default.Types.ObjectId();
    const adminId = new mongoose_1.default.Types.ObjectId();
    console.log(companyId, adminId);
    const session = await mongoose_1.default.startSession();
    let newCompany;
    let newAdmin;
    try {
        session.startTransaction();
        // ── 3. create BOTH in parallel ──────────────────────────
        // company and admin have no dependency on each other now
        // because we pre-generated the IDs
        const [companies, admins] = await Promise.all([
            company_schema_1.default.create([
                {
                    _id: companyId,
                    company_name: company_name,
                    company_email: company_email,
                    companyNavName: company_name,
                    phone: phone,
                    address: address,
                    admin_id: adminId, // ← set directly, no update needed
                    createdBy: req.user._id,
                    status: status,
                    ...(logo && { logo: logo }),
                    ...(domain && { domain: domain }),
                    ...(subdomain && { subdomain: subdomain }),
                },
            ], { session }),
            super_admin_schema_1.default.create([
                {
                    _id: adminId,
                    name: company_name,
                    email: company_email,
                    password: password,
                    role: "admin",
                    company_id: companyId, // ← set directly
                    createdBy: req.user._id,
                },
            ], { session }),
        ]);
        const createdCompany = companies[0];
        const createdAdmin = admins[0];
        if (!createdCompany)
            throw new appError_1.AppError("Failed to create company", 500);
        if (!createdAdmin)
            throw new appError_1.AppError("Failed to create admin", 500);
        newCompany = createdCompany;
        newAdmin = createdAdmin;
        await session.commitTransaction();
    }
    catch (err) {
        await session.abortTransaction();
        throw err;
    }
    finally {
        await session.endSession();
    }
    // ── 4. audit log — fire and forget ─────────────────────
    (0, auditLogger_1.auditLog)({
        req,
        action: audit_interface_1.AUDIT_ACTIONS.COMPANY_CREATED,
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
const getAllCompanies = async (query) => {
    const { page, limit, search, status, sortOrder, sortBy } = query;
    const skip = (page - 1) * limit;
    // ── build filter ────────────────────────────────────────
    const filter = {};
    if (status)
        filter.status = status;
    if (search) {
        filter.$or = [
            { company_name: { $regex: search, $options: "i" } },
            { company_email: { $regex: search, $options: "i" } },
        ];
    }
    // ── run count + data in parallel ────────────────────────
    const [total, companies] = await Promise.all([
        company_schema_1.default.countDocuments(filter),
        company_schema_1.default.find(filter)
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
const getCompanyById = async (companyId, req) => {
    const filter = {
        _id: new mongoose_1.default.Types.ObjectId(companyId),
    };
    // admin can only see their own company
    if (req.user.role === "admin") {
        filter._id = req.user.company_id;
    }
    const company = await company_schema_1.default.findOne(filter)
        .populate("admin_id", "name email role")
        .populate("createdBy", "name email")
        .lean();
    if (!company)
        throw new appError_1.AppError("Company not found", 404);
    return company;
};
const updateCompany = async (companyId, payload, req) => {
    const company = await company_schema_1.default.findById(companyId);
    if (!company)
        throw new appError_1.AppError("Company not found", 404);
    const [domainTaken, subdomainTaken] = await Promise.all([
        payload.domain && payload.domain !== company.domain
            ? company_schema_1.default.findOne({ domain: payload.domain }).lean()
            : null,
        payload.subdomain && payload.subdomain !== company.subdomain
            ? company_schema_1.default.findOne({ subdomain: payload.subdomain }).lean()
            : null,
    ]);
    if (domainTaken)
        throw new appError_1.AppError("Domain already taken", 409);
    if (subdomainTaken)
        throw new appError_1.AppError("Subdomain already taken", 409);
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
    const updateData = (0, sanitizeData_1.sanitizeData)(payload);
    const updated = await company_schema_1.default.findByIdAndUpdate(companyId, { $set: updateData }, { new: true, runValidators: true });
    if (!updated)
        throw new appError_1.AppError("Company update failed", 500);
    // ── audit ───────────────────────────────────────────────
    (0, auditLogger_1.auditLog)({
        req,
        action: audit_interface_1.AUDIT_ACTIONS.COMPANY_UPDATED,
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
const deleteCompany = async (companyId, req) => {
    const company = await company_schema_1.default.findById(companyId);
    if (!company)
        throw new appError_1.AppError("Company not found", 404);
    // snapshot for audit before deletion
    const snapshot = {
        company_name: company.company_name,
        company_email: company.company_email,
        status: company.status,
    };
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        // ── find all users in this company ──────────────────
        const companyUsers = await super_admin_schema_1.default.find({ company_id: company._id }, { _id: 1 }).lean();
        const userIds = companyUsers.map((u) => u._id);
        // ── delete everything in parallel ───────────────────
        await Promise.all([
            company_schema_1.default.findByIdAndDelete(companyId, { session }),
            // delete all users of this company
            super_admin_schema_1.default.deleteMany({ company_id: company._id }, { session }),
            // delete all sessions of those users
            auth_schema_1.default.deleteMany({ userId: { $in: userIds } }, { session }),
        ]);
        await session.commitTransaction();
    }
    catch (err) {
        await session.abortTransaction();
        throw err;
    }
    finally {
        await session.endSession();
    }
    // ── audit ──────────────────────────────────────────────
    (0, auditLogger_1.auditLog)({
        req,
        action: audit_interface_1.AUDIT_ACTIONS.COMPANY_DELETED,
        targetModel: "Company",
        targetId: company._id,
        before: snapshot,
        after: null,
    });
};
exports.UserService = {
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
//# sourceMappingURL=super_admin.service.js.map