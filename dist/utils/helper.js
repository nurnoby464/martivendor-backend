"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeObjectId = exports.calculateTaxRate = exports.calculateDiscount = exports.normalizedBDPhone = exports.generateOPT = exports.makeLoginResponse = exports.profileModelMap = exports.makeToken = void 0;
exports.generateAsin = generateAsin;
exports.extractAsin = extractAsin;
exports.escapeRegex = escapeRegex;
const mongoose_1 = require("mongoose");
const customer_schema_1 = __importDefault(require("../CRM/customer/customer.schema"));
const staff_schema_1 = __importDefault(require("../CRM/staff/staff.schema"));
const sellerStaff_schema_1 = require("../CRM/sellerStaff/sellerStaff.schema");
const seller_schema_1 = require("../module/seller/seller.schema");
const user_schema_1 = __importDefault(require("../module/user/user.schema"));
const money_1 = require("./money");
const { customAlphabet } = require("nanoid");
const makeToken = (payload) => {
    const { existing, session } = payload;
    const data = {
        _id: existing._id,
        email: existing.email,
        name: existing.name,
        role: existing.role,
        profileId: existing.profileId ?? null,
        profileType: existing.profileType ?? null,
        sellerId: existing.sellerId ?? null,
        sessionId: session._id.toString(),
        passwordChangedAt: existing.passwordChangedAt?.getTime() ?? null,
    };
    return data;
};
exports.makeToken = makeToken;
exports.profileModelMap = {
    Seller: seller_schema_1.Seller,
    Customer: customer_schema_1.default,
    Staff: staff_schema_1.default,
    SellerStaff: sellerStaff_schema_1.SellerStaff,
    User: user_schema_1.default,
};
const makeLoginResponse = async (payload) => {
    const { user } = payload;
    // ─── profile: already populated (getMe) or fetch it (login) ──
    let profile = null;
    if (user.profileId && user.profileType) {
        const ProfileModel = exports.profileModelMap[user.profileType];
        profile = await ProfileModel.findById(user.profileId).lean();
    }
    // ─── base — shared by all roles ───────────────────────
    const base = {
        _id: user._id,
        role: user.role,
        sellerId: user.sellerId ?? null,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        profileId: profile?._id ?? null,
        profileType: user.profileType ?? null,
        name: profile?.name ?? user.name,
        email: profile?.email ?? user.email,
        phone: profile?.phone ?? user.phone,
        image: profile?.image ?? null,
    };
    // ─── super_admin ──────────────────────────────────────
    // super_admin's User.profileId/profileType point to the platform Seller doc
    // (isPlatform: true) — same shape as a regular seller, not nulled out.
    if (user.role === "super_admin") {
        return {
            ...base,
            profileType: "Seller",
            shopName: profile?.name ?? null,
            isPlatform: profile?.isPlatform ?? true,
            commissionRate: profile?.commissionRate ?? 0,
        };
    }
    // ─── seller (vendor) ───────────────────────────────────
    if (user.role === "seller") {
        return {
            ...base,
            profileType: "Seller",
            shopName: profile?.name ?? null,
            slug: profile?.slug ?? null,
            status: profile?.status ?? null,
            kycStatus: profile?.kyc?.status ?? null,
            commissionRate: profile?.commissionRate ?? null,
        };
    }
    // ─── seller_staff ──────────────────────────────────────
    if (user.role === "seller_staff") {
        return {
            ...base,
            profileType: "SellerStaff",
            department: profile?.department ?? null,
            designation: profile?.designation ?? null,
            permissions: profile?.permissions ?? [],
            status: profile?.status ?? null,
        };
    }
    // ─── customer ─────────────────────────────────────────
    if (user.role === "customer") {
        return {
            ...base,
            profileType: "Customer",
            is_profile_complete: !!profile,
            dob: profile?.dob ?? null,
            gender: profile?.gender ?? null,
            addresses: profile?.addresses ?? [],
        };
    }
    // ─── platform staff (admin, staff, account, site_management, inventory, sales, report) ──
    return {
        ...base,
        profileType: "Staff",
        is_profile_complete: !!profile,
        designation: profile?.designation ?? null,
        department: profile?.department ?? null,
        joining_date: profile?.joining_date ?? null,
        address: profile?.address ?? null,
    };
};
exports.makeLoginResponse = makeLoginResponse;
const generateOPT = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
exports.generateOPT = generateOPT;
function generateAsin() {
    const nanoid = customAlphabet("23456789ABCDEFGHJKMNPQRSTUVWXYZ", 10);
    return `T${nanoid()}`;
}
const ASIN_PATTERN = /-([T][23456789ABCDEFGHJKMNPQRSTUVWXYZ]{10})$/;
function extractAsin(combinedSlug) {
    const match = combinedSlug.match(ASIN_PATTERN);
    return match?.[1] ?? null;
}
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const normalizedBDPhone = (phone) => {
    const normalized = phone.replace(/[\s()-]/g, "");
    if (normalized.startsWith("+880"))
        return normalized;
    if (normalized.startsWith("880"))
        return `+${normalized}`;
    if (normalized.startsWith("0"))
        return `+88${normalized}`;
    return normalized;
};
exports.normalizedBDPhone = normalizedBDPhone;
const calculateDiscount = (input) => {
    const { lineBase, discountType, discountValue, quantity } = input;
    if (discountType === "percentage") {
        return (lineBase * discountValue) / 100;
    }
    if (discountType === "flat") {
        return discountValue * quantity;
    }
    return 0;
};
exports.calculateDiscount = calculateDiscount;
const calculateTaxRate = (input) => {
    const { totalPrice, taxRate } = input;
    const taxAmount = (totalPrice * taxRate) / 100;
    return (0, money_1.round2)(taxAmount);
};
exports.calculateTaxRate = calculateTaxRate;
const makeObjectId = (value) => {
    return new mongoose_1.Types.ObjectId(String(value));
};
exports.makeObjectId = makeObjectId;
//# sourceMappingURL=helper.js.map