"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSuperAdmin = exports.deleteCompany = exports.updateCompany = exports.getCompanyById = exports.getUserStats = exports.getAllCompanies = exports.createCompany = exports.toggleUserStatus = exports.deleteUser = exports.listUsers = exports.getUserById = exports.createUser = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const appError_1 = require("../../middlewares/appError");
const user_schema_1 = __importDefault(require("./user.schema"));
const seller_schema_1 = require("../seller/seller.schema");
const useSkip_1 = require("../../utils/useSkip");
// ─── Helpers ──────────────────────────────────────────────
function assertValidObjectId(id, label = "ID") {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new appError_1.AppError(`Invalid ${label}: "${id}"`, 400);
    }
}
// ─── createUser ───────────────────────────────────────────
const createUser = async (input, createdBy) => {
    const existing = await user_schema_1.default.findOne({ email: input.email }).lean();
    if (existing) {
        throw new appError_1.AppError("Email already in use", 409);
    }
    const user = await user_schema_1.default.create({
        name: input.name,
        email: input.email,
        password: input.password,
        role: input.role,
        sellerId: input.sellerId
            ? new mongoose_1.default.Types.ObjectId(input.sellerId)
            : null,
        createdBy,
    });
    return user.toJSON();
};
exports.createUser = createUser;
// ─── getUserById ──────────────────────────────────────────
const getUserById = async (id) => {
    assertValidObjectId(id, "user ID");
    const user = await user_schema_1.default.findById(id).lean();
    if (!user)
        throw new appError_1.AppError("User not found", 404);
    return user;
};
exports.getUserById = getUserById;
// ─── listUsers ────────────────────────────────────────────
// Accepts raw req.query — parsing and sanitisation happens here, not in the controller.
const listUsers = async (rawQuery) => {
    const page = Math.max(1, parseInt(rawQuery.page ?? "1", 10));
    const limit = Math.min(100, parseInt(rawQuery.limit ?? "10", 10));
    const skip = (page - 1) * limit;
    const filter = {};
    if (rawQuery.sellerId) {
        assertValidObjectId(rawQuery.sellerId, "sellerId");
        filter.sellerId = new mongoose_1.default.Types.ObjectId(rawQuery.sellerId);
    }
    if (rawQuery.role)
        filter.role = rawQuery.role;
    if (rawQuery.is_active)
        filter.is_active = rawQuery.is_active === "true";
    const [users, total] = await Promise.all([
        user_schema_1.default.find(filter).skip(skip).limit(limit).lean(),
        user_schema_1.default.countDocuments(filter),
    ]);
    return { users, total, page, limit };
};
exports.listUsers = listUsers;
// ─── deleteUser ───────────────────────────────────────────
// super_admin  → can delete anyone
// admin        → can only delete users inside their own company
const deleteUser = async (id, requestor) => {
    assertValidObjectId(id, "user ID");
    const target = await user_schema_1.default.findById(id);
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
        !target.sellerId?.equals(requestor.sellerId)) {
        throw new appError_1.AppError("You can only delete users within your company", 403);
    }
    await target.deleteOne();
};
exports.deleteUser = deleteUser;
// ─── toggleUserStatus ─────────────────────────────────────
// Flips is_active. Same scope rules as deleteUser.
const toggleUserStatus = async (id, requestor) => {
    assertValidObjectId(id, "user ID");
    const target = await user_schema_1.default.findById(id);
    if (!target)
        throw new appError_1.AppError("User not found", 404);
    if (target._id.equals(requestor._id)) {
        throw new appError_1.AppError("You cannot change your own status", 400);
    }
    if (target.role === "super_admin") {
        throw new appError_1.AppError("super_admin status cannot be changed", 403);
    }
    if (requestor.role === "admin" &&
        !target.sellerId?.equals(requestor.sellerId)) {
        throw new appError_1.AppError("You can only manage users within your company", 403);
    }
    target.isActive = !target.isActive;
    await target.save();
    return target.toJSON();
};
exports.toggleUserStatus = toggleUserStatus;
// create company
const createCompany = async (payload, req) => {
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
exports.createCompany = createCompany;
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
        seller_schema_1.Seller.countDocuments(filter),
        seller_schema_1.Seller.find(filter)
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
exports.getAllCompanies = getAllCompanies;
const getUserStats = async (query) => {
    const { page, limit, search, status, sortOrder, sortBy } = query;
    // ── build filter ────────────────────────────────────────
    const filter = {};
    if (search) {
        const regex = new RegExp(search.trim(), "i");
        filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }
    const [result, total] = await Promise.all([
        user_schema_1.default.aggregate([
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
                        { $skip: (0, useSkip_1.useSkip)({ page, limit }) },
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
                                    { $project: { _id: 1, name: 1, email: 1, phone: 1 } },
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
        user_schema_1.default.countDocuments(filter),
    ]);
    const stats = result?.[0]?.stats;
    const users = result?.[0]?.users;
    return { stats, users, total, page, limit };
};
exports.getUserStats = getUserStats;
const getCompanyById = async (sellerId, req) => {
    const filter = {
        _id: new mongoose_1.default.Types.ObjectId(sellerId),
    };
    // admin can only see their own company
    if (req.user.role === "admin") {
        filter._id = req.user.sellerId;
    }
    const company = await seller_schema_1.Seller.findOne(filter)
        .populate("admin_id", "name email role")
        .populate("createdBy", "name email")
        .lean();
    if (!company)
        throw new appError_1.AppError("Company not found", 404);
    return company;
};
exports.getCompanyById = getCompanyById;
const updateCompany = async (sellerId, payload, req) => {
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
exports.updateCompany = updateCompany;
const deleteCompany = async (sellerId, req) => {
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
exports.deleteCompany = deleteCompany;
const createSuperAdmin = async (payload) => {
    const { name, phone, email, password, shopName } = payload;
    const slug = shopName
        .toLowerCase()
        .replace(/'/g, "") // Remove apostrophes
        .replace(/&/g, " ") // Replace & with space
        .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with -
        .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
    const [existingUser, existingPlatformSeller, existingSlug] = await Promise.all([
        user_schema_1.default.findOne({ email }),
        seller_schema_1.Seller.findOne({ isPlatform: true }),
        seller_schema_1.Seller.findOne({ slug }),
    ]);
    if (existingUser)
        throw new appError_1.AppError("This user already exists", 409);
    if (existingPlatformSeller)
        throw new appError_1.AppError("Super admin already exists", 409);
    if (existingSlug)
        throw new appError_1.AppError("Shop name is already taken, choose another", 409);
    const session = await mongoose_1.default.startSession();
    const id = new mongoose_1.default.Types.ObjectId();
    try {
        session.startTransaction();
        const [newUser] = await user_schema_1.default.create([
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
        ], { session });
        if (!newUser)
            throw new appError_1.AppError("super admin create failed", 400);
        const [newSeller] = await seller_schema_1.Seller.create([
            {
                _id: id,
                userId: newUser._id,
                isPlatform: true,
                name: shopName,
                slug,
            },
        ], { session });
        if (!newSeller)
            throw new appError_1.AppError("seller crated failed", 400);
        await session.commitTransaction();
        return newUser;
    }
    catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        await session.endSession();
    }
};
exports.createSuperAdmin = createSuperAdmin;
//# sourceMappingURL=user.service.js.map