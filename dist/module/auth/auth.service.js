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
exports.AuthServices = exports.getMe = void 0;
const appError_1 = require("./../../middlewares/appError");
const mongoose_1 = __importStar(require("mongoose"));
const jwt_config_1 = require("./../../config/jwt.config");
const appError_2 = require("../../middlewares/appError");
const jwtHelper_1 = require("../../utils/jwtHelper");
const user_schema_1 = __importDefault(require("../user/user.schema"));
const auth_schema_1 = __importDefault(require("./auth.schema"));
const helper_1 = require("../../utils/helper");
const staff_schema_1 = __importDefault(require("../../CRM/staff/staff.schema"));
const customer_schema_1 = __importDefault(require("../../CRM/customer/customer.schema"));
const login = async (payload, req) => {
    const MAX_SESSIONS = 6;
    const { email, password } = payload;
    const existing = await user_schema_1.default.findOne({ email, is_active: true }).select("+password");
    if (!existing) {
        throw new appError_2.AppError("This email user not found", 400);
    }
    const isMatch = await existing.comparePassword(password);
    if (!isMatch) {
        throw new appError_2.AppError("Password incorrect!", 400);
    }
    //check session limit
    const activeSessions = await auth_schema_1.default.find({
        userId: existing._id,
        valid: true,
    })
        .sort({ updatedAt: -1 }) // newest first for display
        .select("_id user_agent userId ip createdAt updatedAt")
        .lean();
    if (activeSessions.length >= MAX_SESSIONS) {
        const sessionList = activeSessions?.map((session) => ({
            sessionId: session._id.toString(),
            user_agent: session.user_agent,
            userId: session.userId.toString(),
            ip: session.ip,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
        }));
        throw new appError_1.SessionLimitError(sessionList);
    }
    // await enforceSessionLimit(existing._id);
    // Layer 1 — reuse or create session
    const session = await auth_schema_1.default.findOneAndUpdate({
        userId: existing._id,
        valid: true,
        user_agent: req.headers["user-agent"] ?? null,
    }, {
        $set: {
            ip: req.ip ?? null,
        },
        $setOnInsert: {
            userId: existing._id,
            valid: true,
            user_agent: req.headers["user-agent"] ?? null,
        },
    }, {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
    });
    if (!session) {
        throw new appError_2.AppError("Session created failed");
    }
    // const dataa: ITokenPayload = {
    //   _id: existing._id,
    //   // email: existing.email,
    //   // name: existing.name,
    //   role: existing.role,
    //   sellerId: existing.sellerId ?? null,
    //   sessionId: session._id.toString(),
    //   passwordChangedAt: existing.passwordChangedAt?.getTime() ?? null
    // };
    const data = (0, helper_1.makeToken)({ existing, session });
    const accessToken = await jwtHelper_1.JwtHelper.generateToken({
        data,
        secret: jwt_config_1.jwtConfig.access.secret,
        expiresIn: jwt_config_1.jwtConfig.access.expiresIn,
    });
    const refreshToken = await jwtHelper_1.JwtHelper.generateToken({
        data,
        secret: jwt_config_1.jwtConfig.refresh.secret,
        expiresIn: jwt_config_1.jwtConfig.refresh.expiresIn,
    });
    const result = await user_schema_1.default.findByIdAndUpdate(existing._id, { last_login: new Date() }, { returnDocument: "after", runValidators: true });
    if (!result) {
        throw new appError_2.AppError("Last login not updated");
    }
    const user = result.toJSON();
    const response = await (0, helper_1.makeLoginResponse)({ user });
    return {
        user: response,
        accessToken,
        refreshToken,
    };
};
// ─── Logout ───────────────────────────────────────────────
const logout = async (refreshToken) => {
    if (!refreshToken)
        throw new appError_2.AppError("Already logged out", 400);
    const decoded = jwtHelper_1.JwtHelper.verifyToken({
        token: refreshToken,
        secret: jwt_config_1.jwtConfig.refresh.secret,
    });
    if (!decoded) {
        throw new appError_2.AppError("Token data not found", 400);
    }
    await auth_schema_1.default.findByIdAndUpdate(decoded.sessionId, {
        valid: false,
    });
};
// ─── Refresh ──────────────────────────────────────────────
const refresh = async (refreshToken) => {
    // 1. verify refresh token
    let decoded;
    try {
        decoded = jwtHelper_1.JwtHelper.verifyToken({
            token: refreshToken,
            secret: jwt_config_1.jwtConfig.refresh.secret,
        });
    }
    catch {
        throw new appError_2.AppError("Invalid or expired refresh token", 401);
    }
    // 2. find session
    const session = await auth_schema_1.default.findById(decoded.sessionId);
    if (!session || !session.valid) {
        throw new appError_2.AppError("Session expired. Please log in again", 401);
    }
    // 3. find user
    const user = await user_schema_1.default.findOne({ _id: session.userId, is_active: true });
    if (!user) {
        throw new appError_2.AppError("User no longer exists", 401);
    }
    // 4. issue new access token
    const data = (0, helper_1.makeToken)({ existing: user, session });
    const newAccessToken = jwtHelper_1.JwtHelper.generateToken({
        data,
        secret: jwt_config_1.jwtConfig.access.secret,
        expiresIn: jwt_config_1.jwtConfig.access.expiresIn,
    });
    return { accessToken: newAccessToken };
};
const removeSession = async (sessionId, userId) => {
    const session = await auth_schema_1.default.findOneAndDelete({
        _id: new mongoose_1.Types.ObjectId(sessionId),
        userId: new mongoose_1.Types.ObjectId(userId),
    });
    if (!session)
        throw new appError_2.AppError("Session not found", 404);
};
const updatePassword = async (payload) => {
    const { userId, sessionId, oldPassword, newPassword } = payload;
    const user = await user_schema_1.default.findOne({
        _id: new mongoose_1.Types.ObjectId(userId),
        is_active: true,
    }).select("+password");
    if (!user)
        throw new appError_2.AppError("User not found", 404);
    // check old password
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch)
        throw new appError_2.AppError("Current password is incorrect", 400);
    // check new password is same as old password
    const isSame = await user.comparePassword(newPassword);
    if (isSame) {
        throw new appError_2.AppError("New password must be different from old password", 400);
    }
    // update password
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();
    await auth_schema_1.default.deleteMany({
        userId: user._id,
        _id: { $ne: new mongoose_1.Types.ObjectId(sessionId) },
    });
    return {
        message: "Password updated. All other sessions have been logged out.",
    };
};
const registerCustomer = async (sellerId, input) => {
    const { name, phone, email, password } = input;
    // 1. check duplicate phone under same company
    const existing = await user_schema_1.default.findOne({
        sellerId,
        email,
        role: "customer",
    });
    if (existing) {
        throw new appError_2.AppError("This email already registered", 409);
    }
    // 3. create user — NO customer CRM doc yet
    const user = await user_schema_1.default.create({
        sellerId,
        name,
        email,
        password,
        role: "customer",
        profileType: "Customer",
        isActive: true,
    });
    // 4. strip password before returning
    const { password: _, ...safeUser } = user.toObject();
    return safeUser;
};
const getMe = async (userId, sessionId) => {
    const user = await user_schema_1.default.findById(userId).lean();
    if (!user)
        throw new appError_2.AppError("User not found", 404);
    const session = await auth_schema_1.default.findById(sessionId).lean();
    if (!session) {
        throw new appError_2.AppError("session not found", 401);
    }
    const data = (0, helper_1.makeToken)({ existing: user, session });
    const accessToken = await jwtHelper_1.JwtHelper.generateToken({
        data,
        secret: jwt_config_1.jwtConfig.access.secret,
        expiresIn: jwt_config_1.jwtConfig.access.expiresIn,
    });
    const refreshToken = await jwtHelper_1.JwtHelper.generateToken({
        data,
        secret: jwt_config_1.jwtConfig.refresh.secret,
        expiresIn: jwt_config_1.jwtConfig.refresh.expiresIn,
    });
    // reuse same helper
    const response = await (0, helper_1.makeLoginResponse)({ user });
    return {
        user: response,
        accessToken,
        refreshToken,
    };
};
exports.getMe = getMe;
const updateProfile = async (companyId, userId, input) => {
    const { role, profileType, profileData, userData } = input;
    const session = await mongoose_1.default.startSession();
    try {
        await session.startTransaction();
        if (role === "customer") {
            const customer = await customer_schema_1.default.updateOne({ companyId, userId }, {
                $set: { ...profileData, ...userData },
            }, { session, runValidators: true });
            if (customer.matchedCount === 0) {
                throw new appError_2.AppError("Profile not found", 404);
            }
        }
        else {
            const staff = await staff_schema_1.default.updateOne({ companyId, userId }, {
                $set: { ...profileData, ...userData },
            }, { session, runValidators: true });
            if (staff.matchedCount === 0) {
                throw new appError_2.AppError("Profile not found", 404);
            }
        }
        const user = await user_schema_1.default.findByIdAndUpdate(userId, { $set: { name: userData?.name, phone: userData?.phone } }, { session, returnDocument: "after", runValidators: true });
        if (!user) {
            throw new appError_2.AppError("User not found", 404);
        }
        await session.commitTransaction();
    }
    catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        await session.endSession();
    }
    // const result = await profileModel.updateOne(
    //   { companyId, userId },
    //   {
    //     $set: { ...profileData, ...userData },
    //   },
    // );
    // const user = await User.findByIdAndUpdate(userId, {
    //   $set: {
    //     name: userData?.name,
    //     phone: userData?.phone,
    //   },
    // });
    // console.log(
    //   "Updating profile for role:",
    //   role,
    //   "profileType:",
    //   profileType,
    //   profileModel,
    // );
    // console.log("Profile data:", profileData, userData);
};
exports.AuthServices = {
    login,
    logout,
    refresh,
    removeSession,
    updatePassword,
    registerCustomer,
    getMe: exports.getMe,
    updateProfile,
};
//# sourceMappingURL=auth.service.js.map