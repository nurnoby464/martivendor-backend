"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyServices = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const appError_1 = require("../../middlewares/appError");
const user_schema_1 = __importDefault(require("../user/user.schema"));
const auditLogger_1 = require("../../utils/auditLogger");
const audit_interface_1 = require("../audit/audit.interface");
const auth_schema_1 = __importDefault(require("../auth/auth.schema"));
const seller_header_schema_1 = require("./seller.header.schema");
const seller_schema_1 = require("./seller.schema");
const ADMIN_ROLES = [
    "account",
    "site_management",
    "inventory",
    "sales",
    "report",
];
const SUPER_ADMIN_ROLES = ["admin", ...ADMIN_ROLES];
const targetFinder = async (userId, req, action) => {
    const filter = {
        _id: new mongoose_1.default.Types.ObjectId(userId),
    };
    if (req.user.role === "admin") {
        filter.sellerId = req.user.sellerId;
    }
    const target = await user_schema_1.default.findOne(filter).lean();
    if (!target) {
        throw new appError_1.AppError("Target user not found", 404);
    }
    if (target._id.equals(req.user._id)) {
        throw new appError_1.AppError(`You cannot ${action} your own account`, 400);
    }
    if (target.role === "super_admin") {
        throw new appError_1.AppError(`super_admin accounts cannot be ${action}`, 403);
    }
    if (target.role === "admin" && req.user.role === "admin") {
        throw new appError_1.AppError(`Admin cannot ${action} another admin`, 403);
    }
    return target;
};
const createCompanyUser = async (payload, req) => {
    const { companyId, name, email, role, password } = payload;
    const isSuperAdmin = req.user.role === "super_admin";
    if (isSuperAdmin) {
        if (!companyId) {
            throw new appError_1.AppError("Company Id is required for Super Admin", 400);
        }
        if (!SUPER_ADMIN_ROLES.includes(role)) {
            throw new appError_1.AppError(`Invalid role: ${role}`, 403);
        }
    }
    else {
        if (!ADMIN_ROLES.includes(role)) {
            throw new appError_1.AppError(`Admin cannot assign role: ${role}`, 403);
        }
    }
    let companyIdToUse;
    if (isSuperAdmin) {
        const [existing, company] = await Promise.all([
            user_schema_1.default.findOne({ email }).select("_id").lean(),
            seller_schema_1.Seller.findById(companyId).select("_id status").lean(),
        ]);
        if (existing)
            throw new appError_1.AppError("Email already registered", 409);
        if (!company) {
            throw new appError_1.AppError("Company not found", 404);
        }
        if (company.status !== "approved") {
            throw new appError_1.AppError("Cannot create user for an inactive company", 400);
        }
        companyIdToUse = company._id;
    }
    else {
        if (!req.user.sellerId)
            throw new appError_1.AppError("Company not found", 404);
        const existing = await user_schema_1.default.findOne({ email }).select("_id").lean();
        if (existing)
            throw new appError_1.AppError("Email already registered", 409);
        companyIdToUse = new mongoose_1.default.Types.ObjectId(req.user.sellerId.toString());
    }
    const user = await user_schema_1.default.create({
        name,
        email,
        password,
        role,
        createdBy: req.user._id,
        sellerId: companyIdToUse,
    });
    (0, auditLogger_1.auditLog)({
        req,
        action: audit_interface_1.AUDIT_ACTIONS.USER_CREATED,
        targetModel: "User",
        targetId: user._id,
        after: {
            name: user.name,
            email: user.email,
            role: user.role,
            sellerId: user.sellerId,
            isActive: user.isActive,
        },
    });
    return user.toJSON();
};
const getAllUsers = async (query, req) => {
    const { page, limit, search, role, is_active, sortBy, sortOrder, sellerId, } = query;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.user.role === "admin") {
        filter.sellerId = req.user.sellerId;
        filter.role = {
            $in: ["account", "site_management", "inventory", "sales", "report"],
        };
    }
    else {
        if (sellerId)
            filter.sellerId = new mongoose_1.default.Types.ObjectId(sellerId);
    }
    if (role)
        filter.role = role;
    if (is_active)
        filter.is_active = is_active;
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
        ];
    }
    const [total, user] = await Promise.all([
        user_schema_1.default.countDocuments(filter),
        user_schema_1.default.find(filter)
            .select("-password -reset_token -reset_token_exp")
            .populate("sellerId", "company_name company_email status")
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
const getUserById = async (userId, req) => {
    const filter = {
        _id: new mongoose_1.default.Types.ObjectId(userId),
    };
    // admin can only see users in their own company
    if (req.user.role === "admin") {
        filter.sellerId = req.user.sellerId;
    }
    const user = await user_schema_1.default.findOne(filter)
        .select("-password -reset_token -reset_token_exp")
        .populate("sellerId", "company_name company_email status")
        .populate("createdBy", "name email")
        .lean();
    if (!user)
        throw new appError_1.AppError("Single user not found", 404);
    return user;
};
const updateUser = async (userId, payload, req) => {
    const target = await targetFinder(userId, req, "update");
    // if (payload.role && req.user.role === "admin") {
    //   throw new AppError("Admin cannot change user roles", 403);
    // }
    const before = {
        name: target.name,
        role: target.role,
        isActive: target.isActive,
    };
    const updateData = {};
    if (payload.name !== undefined)
        updateData.name = payload.name;
    if (payload.role !== undefined)
        updateData.role = payload.role;
    if (payload.is_active !== undefined)
        updateData.is_active = payload.is_active;
    if (Object.keys(updateData).length === 0) {
        throw new appError_1.AppError("No fields to update", 400);
    }
    const updated = await user_schema_1.default.findByIdAndUpdate(userId, {
        $set: updateData,
    }, { returnDocument: "after", runValidators: true }).select("-password -reset_token -reset_token_exp");
    if (!updated)
        throw new appError_1.AppError("User update failed", 500);
    if (payload.is_active === false) {
        await auth_schema_1.default.deleteMany({ userId: target._id });
    }
    (0, auditLogger_1.auditLog)({
        req,
        action: "USER_UPDATED",
        targetModel: "User",
        targetId: updated._id,
        before,
        after: {
            name: updated.name,
            role: updated.role,
            isActive: updated.isActive,
        },
    });
    return updated.toJSON();
};
const deleteUser = async (userId, req) => {
    const target = await targetFinder(userId, req, "delete");
    // snapshot for audit
    const snapshot = {
        name: target.name,
        email: target.email,
        role: target.role,
        sellerId: target.sellerId,
        isActive: target.isActive,
    };
    // ── delete user + their sessions in parallel ──────────
    await Promise.all([
        user_schema_1.default.findByIdAndDelete(userId),
        auth_schema_1.default.deleteMany({ userId: target._id }),
    ]);
    // ── audit ──────────────────────────────────────────────
    (0, auditLogger_1.auditLog)({
        req,
        action: audit_interface_1.AUDIT_ACTIONS.USER_DELETED,
        targetModel: "User",
        targetId: target._id,
        before: snapshot,
        after: null,
    });
};
const getMyCompany = async (id) => {
    const result = await seller_schema_1.Seller.findById(id);
    return result;
};
const updateMyCompany = async (companyId, data) => {
    const company = await seller_schema_1.Seller.findById(companyId);
    if (!company)
        throw new appError_1.AppError("Company not found", 404);
    // build update object — only include fields that were actually sent
    const update = {};
    if (data.company_name !== undefined)
        update.company_name = data.company_name;
    if (data.phone !== undefined)
        update.phone = data.phone;
    if (data.address !== undefined)
        update.address = data.address;
    if (data.companyNavName !== undefined)
        update.companyNavName = data.companyNavName;
    // logo: only update if a non-empty URL was provided
    if (data.logo && data.logo.trim() !== "") {
        update.logo = data.logo;
    }
    const updated = await seller_schema_1.Seller.findByIdAndUpdate(companyId, { $set: update }, { returnDocument: "after", runValidators: true }).lean();
    return updated;
};
const updateSocialMedia = async (companyId, data) => {
    const company = await seller_schema_1.Seller.findById(companyId);
    if (!company)
        throw new appError_1.AppError("Company not found", 404);
    if (!data.social_media)
        throw new appError_1.AppError("No social media data provided", 400);
    // build $set only for fields that were actually sent
    const socialUpdate = {};
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
    ];
    fields.forEach((field) => {
        const value = data.social_media?.[field];
        if (value !== undefined) {
            // store empty string as null
            socialUpdate[`social_media.${field}`] = value === "" ? null : value;
        }
    });
    const updated = await seller_schema_1.Seller.findByIdAndUpdate(companyId, { $set: socialUpdate }, { returnDocument: "after", runValidators: true }).lean();
    return updated;
};
const createHeaderNav = async (companyId, input) => {
    const { label } = input;
    const existing = await seller_header_schema_1.NavConfig.findOne({
        companyId,
        "navItems.label": label,
    });
    if (existing) {
        throw new appError_1.AppError(`${label} is already exist in nav items.`);
    }
    const result = await seller_header_schema_1.NavConfig.findOneAndUpdate({
        companyId,
    }, {
        $push: {
            navItems: input,
        },
    }, {
        returnDocument: "after",
        upsert: true,
    });
    if (!result) {
        throw new appError_1.AppError(`Failed to create this ${label} nav`);
    }
    return result;
};
const getHeaderNav = async (companyId) => {
    const navItems = await seller_header_schema_1.NavConfig.findOne({
        companyId,
    }).lean();
    if (!navItems) {
        return [];
    }
    return navItems;
};
const reOrderHeaderNav = async (companyId, navConfigId, input) => {
    const session = await mongoose_1.default.startSession();
    try {
        let updated;
        session.startTransaction();
        const navConfig = await seller_header_schema_1.NavConfig.findOne({
            companyId,
            _id: navConfigId,
        }).session(session);
        if (!navConfig) {
            throw new appError_1.AppError("This nav items not found", 404);
        }
        const existingId = new Set(navConfig.navItems.map((item) => item._id.toString()));
        const incomingIds = input.navItems.map((item) => item._id);
        const allBelong = incomingIds.every((id) => existingId.has(id));
        if (!allBelong || incomingIds.length !== existingId.size) {
            throw new appError_1.AppError("navItems must match the existing nav items exactly", 400);
        }
        const orderMap = new Map(input.navItems.map((i) => [i._id, i.order]));
        navConfig.navItems = navConfig.navItems
            .map((item) => {
            item.order = orderMap.get(item._id.toString()) ?? item.order;
            return item;
        })
            .sort((a, b) => a.order - b.order);
        updated = await navConfig.save({ session });
        // await session.commitTransaction()
        return updated;
    }
    catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        await session.endSession();
    }
};
const updateHeaderNav = async (companyId, navId, input) => {
    const { _id } = input;
    // console.log(input, navId);
    const existing = await seller_header_schema_1.NavConfig.findOne({
        companyId,
        _id: navId,
    });
    if (!existing) {
        throw new appError_1.AppError("This nav items not found", 404);
    }
    const result = await seller_header_schema_1.NavConfig.findOneAndUpdate({ companyId, _id: navId, "navItems._id": new mongoose_1.Types.ObjectId(_id) }, {
        $set: {
            "navItems.$.label": input.label,
            "navItems.$.keyword": input.keyword,
            "navItems.$.sectionTitle": input.sectionTitle,
            "navItems.$.isActiveInNav": input.isActiveInNav,
            "navItems.$.showOnHomepage": input.showOnHomepage,
        },
    }, {
        returnDocument: "after",
        runValidators: true,
    });
    if (!result) {
        throw new appError_1.AppError("Failed to delete navIem", 400);
    }
    return result;
};
const deleteHeaderNav = async (companyId, payload) => {
    const { id, navItemId } = payload;
    const existing = await seller_header_schema_1.NavConfig.findOne({
        companyId,
        _id: new mongoose_1.Types.ObjectId(id),
    });
    if (!existing) {
        throw new appError_1.AppError("This nav items not found", 404);
    }
    const result = await seller_header_schema_1.NavConfig.findOneAndUpdate({ companyId, _id: new mongoose_1.Types.ObjectId(id) }, {
        $pull: {
            navItems: {
                _id: new mongoose_1.Types.ObjectId(navItemId),
            },
        },
    }, {
        returnDocument: "after",
        runValidators: true,
    });
    if (!result) {
        throw new appError_1.AppError("Failed to delete navIem", 400);
    }
    return result;
};
exports.CompanyServices = {
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
//# sourceMappingURL=seller.service.js.map