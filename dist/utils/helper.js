"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeLoginResponse = exports.makeToken = void 0;
const customer_schema_1 = __importDefault(require("../CRM/customer/customer.schema"));
const staff_schema_1 = __importDefault(require("../CRM/staff/staff.schema"));
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
const makeLoginResponse = async (payload) => {
    const { user } = payload;
    // ─── profile: already populated (getMe) or fetch it (login) ──
    let profile = null;
    if (user.profileId) {
        // just an ObjectId — fetch from correct model
        if (user.role === "customer") {
            profile = await customer_schema_1.default.findById(user.profileId).lean();
        }
        else {
            profile = await staff_schema_1.default.findById(user.profileId).lean();
        }
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
    if (user.role === "super_admin") {
        return { ...base, sellerId: null, profileId: null, profileType: null };
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
    // ─── staff ────────────────────────────────────────────
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
//# sourceMappingURL=helper.js.map