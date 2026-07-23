import mongoose from "mongoose";
import { UserRole } from "../module/user/super_admin.interface";
import { ProfileType } from "../module/user/user.interface";

// ─── Extend Express Request ───────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user: {
        _id: mongoose.Types.ObjectId;
        email: string;
        name: string;
        role: UserRole;
        sellerId: mongoose.Types.ObjectId | null;
        profileId: mongoose.Types.ObjectId | null;
        profileType:ProfileType | null;
        sessionId: string;
        passwordChangedAt: number | null;
        iat?: number; 
        exp?: number;
      };
      validatedQuery : Record<string, unknown>;
      company?:{
        _id: mongoose.Types.ObjectId;
        company_name: string;
        logo: string | null;
        subdomain: string | null;
        domain: string | null;
        status: "active" | "inactive" | "suspended";
      }
    }
  }
}
export {};
