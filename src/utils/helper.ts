import { Model } from "mongoose";
import Customer from "../CRM/customer/customer.schema";
import Staff from "../CRM/staff/staff.schema";
import { SellerStaff } from "../CRM/sellerStaff/sellerStaff.schema";
import { Seller } from "../module/seller/seller.schema";
import { ISessionDocument } from "../module/auth/auth.interface";
import { IUserDocument, ProfileType } from "../module/user/user.interface";
import { ITokenPayload } from "./jwtHelper";
import { customAlphabet } from "nanoid";
type IMakeToken = {
  existing: IUserDocument;
  session: ISessionDocument;
};

export const makeToken = (payload: IMakeToken) => {
  const { existing, session } = payload;
  const data: ITokenPayload = {
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

type IMakeLoginResponse = {
  user: IUserDocument;
  //   session: ISessionDocument;
};

export const profileModelMap: Record<ProfileType, Model<any>> = {
  Seller,
  Customer,
  Staff,
  SellerStaff,
};
export const makeLoginResponse = async (payload: IMakeLoginResponse) => {
  const { user } = payload;

  // ─── profile: already populated (getMe) or fetch it (login) ──
  let profile: any = null;

  if (user.profileId && user.profileType) {
    const ProfileModel = profileModelMap[user.profileType];
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
      shopName: profile?.shopName ?? null,
      isPlatform: profile?.isPlatform ?? true,
      commissionRate: profile?.commissionRate ?? 0,
    };
  }

  // ─── seller (vendor) ───────────────────────────────────
  if (user.role === "seller") {
    return {
      ...base,
      profileType: "Seller",
      shopName: profile?.shopName ?? null,
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

export const generateOPT = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export function generateAsin(): string {
  const nanoid = customAlphabet("23456789ABCDEFGHJKMNPQRSTUVWXYZ", 10);
  return `T${nanoid()}`;
}

const ASIN_PATTERN = /-([T][23456789ABCDEFGHJKMNPQRSTUVWXYZ]{10})$/;

export function extractAsin(combinedSlug: string): string | null {
  const match = combinedSlug.match(ASIN_PATTERN);
  return match?.[1] ?? null;
}
