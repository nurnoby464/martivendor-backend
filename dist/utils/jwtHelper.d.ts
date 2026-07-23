import { Secret } from "jsonwebtoken";
import mongoose from "mongoose";
import type { StringValue } from "ms";
import { ProfileType, UserRole } from "../module/user/user.interface";
export interface ITokenPayload {
    _id: mongoose.Types.ObjectId;
    email: string;
    name: string;
    role: UserRole;
    profileId: mongoose.Types.ObjectId | null;
    profileType: ProfileType | null;
    sellerId: mongoose.Types.ObjectId | null;
    sessionId: string;
    passwordChangedAt: number | null;
    iat?: number;
    exp?: number;
}
interface IGenerateToken {
    data: ITokenPayload;
    secret: Secret;
    expiresIn: StringValue;
}
interface IVerifyToken {
    token: string;
    secret: string;
}
export declare const JwtHelper: {
    generateToken: (payload: IGenerateToken) => string;
    verifyToken: (payload: IVerifyToken) => ITokenPayload;
};
export {};
//# sourceMappingURL=jwtHelper.d.ts.map