import Customer from "../CRM/customer/customer.schema";
import Staff from "../CRM/staff/staff.schema";
import { ISessionDocument } from "../module/auth/auth.interface";
import { IUserDocument } from "../module/user/user.interface";
import { ITokenPayload } from "./jwtHelper";
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
    profileId:existing.profileId ?? null,
    profileType:existing.profileType ?? null,
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
export const makeLoginResponse = async (payload: IMakeLoginResponse) => {
  const { user } = payload;
  // ─── profile: already populated (getMe) or fetch it (login) ──
  let profile: any = null;

  if (user.profileId) {
    // just an ObjectId — fetch from correct model
      if (user.role === "customer") {
        profile = await Customer.findById(user.profileId).lean();
      } else {
        profile = await Staff.findById(user.profileId).lean();
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
