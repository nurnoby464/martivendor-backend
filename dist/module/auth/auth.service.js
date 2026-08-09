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
const seller_schema_1 = require("../seller/seller.schema");
const seller_opt_schema_1 = require("../seller/seller.opt.schema");
const email_services_1 = require("../../utils/email.services");
const otp_template_1 = require("../../templates/otp.template");
const login = async (payload, req) => {
    const MAX_SESSIONS = 6;
    const { email, password } = payload;
    const existing = await user_schema_1.default.findOne({ email, isActive: true }).select("+password");
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
    const user = await user_schema_1.default.findOne({ _id: session.userId, isActive: true });
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
const registerSeller = async (input) => {
    const { name, phone, email, password, shopName } = input;
    const slug = shopName
        .toLowerCase()
        .replace(/'/g, "") // Remove apostrophes
        .replace(/&/g, " ") // Replace & with space
        .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with -
        .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
    // 1. check duplicate phone under same company
    const [existingUser, existingSeller] = await Promise.all([
        user_schema_1.default.findOne({
            email,
            role: "seller",
        }),
        seller_schema_1.Seller.findOne({
            slug,
        }),
    ]);
    if (existingUser) {
        throw new appError_2.AppError("This email already registered", 409);
    }
    if (existingSeller) {
        throw new appError_2.AppError("Shop name is already taken, choose another", 409);
    }
    const id = new mongoose_1.Types.ObjectId();
    const session = await (0, mongoose_1.startSession)();
    try {
        session.startTransaction();
        const [user] = await user_schema_1.default.create([
            {
                name,
                email,
                password,
                ...(phone !== undefined && { phone }),
                role: "seller",
                sellerId: id,
                profileId: id,
                profileType: "Seller",
                isActive: true,
            },
        ], { session });
        if (!user) {
            throw new appError_2.AppError("Failed to create user", 500);
        }
        const [seller] = await seller_schema_1.Seller.create([
            {
                _id: id,
                userId: user._id,
                isPlatform: false,
                name: shopName,
                slug,
            },
        ], { session });
        if (!seller) {
            throw new appError_2.AppError("Failed to create seller");
        }
        const result = await seller_opt_schema_1.Otp.findOneAndUpdate({ userId: seller.userId }, { otp: (0, helper_1.generateOPT)() }, { upsert: true, runValidators: true, returnDocument: "after", session });
        if (!result)
            throw new appError_2.AppError("Failed to create OTP", 500);
        try {
            await (0, email_services_1.sendEmail)({
                to: email,
                subject: "Email Verification",
                html: (0, otp_template_1.otpTemplate)(name, result.otp),
            });
        }
        catch (error) {
            console.error("Email Error:", {
                message: error.message,
                code: error.code,
                responseCode: error.responseCode,
                command: error.command,
                response: error.response,
            });
            throw new appError_2.AppError("Failed to send verification email", 500);
        }
        // now send OPT to email.  i will finish letter
        await session.commitTransaction();
        return seller;
    }
    catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        await session.endSession();
    }
};
const verifySellerOPT = async (payload) => {
    const { email, otp } = payload;
    const existingUser = await user_schema_1.default.findOne({
        email,
        isActive: true,
        role: "seller",
    })
        .select("_id")
        .lean();
    if (!existingUser) {
        throw new appError_2.AppError("User not found with this email", 404);
    }
    const existingSeller = await seller_schema_1.Seller.findOne({
        userId: existingUser._id,
        status: { $nin: ["rejected", "suspended"] },
    })
        .select("_id userId")
        .lean();
    if (!existingSeller) {
        throw new appError_2.AppError("You are not valid seller", 400);
    }
    const existingOTP = await seller_opt_schema_1.Otp.findOne({
        userId: existingSeller.userId,
    }).lean();
    console.log(existingOTP);
    if (!existingOTP)
        throw new appError_2.AppError("OTP not found", 404);
    if (existingOTP.expiresAt < new Date()) {
        throw new Error("OTP has expired");
    }
    if (existingOTP.otp !== otp)
        throw new appError_2.AppError("Incorrect OTP", 400);
    const session = await (0, mongoose_1.startSession)();
    try {
        session.startTransaction();
        const updateUser = await user_schema_1.default.findOneAndUpdate({
            email,
            role: "seller",
            isActive: true,
        }, {
            $set: {
                emailVerified: true,
            },
        }, {
            returnDocument: "after",
            runValidators: true,
            session,
        });
        if (!updateUser) {
            throw new appError_2.AppError("Email not verified", 500);
        }
        const updateSeller = await seller_schema_1.Seller.findOneAndUpdate({ userId: updateUser._id, status: { $nin: ["rejected", "suspended"] } }, { $set: { status: "approved" } }, { returnDocument: "after", runValidators: true, session });
        if (!updateSeller) {
            const currentSeller = await seller_schema_1.Seller.findOne({ userId: updateUser._id })
                .select("status")
                .session(session)
                .lean();
            if (!currentSeller) {
                throw new appError_2.AppError("Seller not found", 404);
            }
            throw new appError_2.AppError(`Seller cannot be approved. Current status: ${currentSeller.status}`, 409);
        }
        await session.commitTransaction();
        return updateSeller;
    }
    catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        await session.endSession();
    }
};
const resendOPT = async (payload) => {
    const { email } = payload;
    console.log(email);
    const existingUser = await user_schema_1.default.findOne({
        email,
        isActive: true,
        role: "seller",
    })
        .select("_id name email")
        .lean();
    if (!existingUser) {
        throw new appError_2.AppError("User not found with this email", 404);
    }
    const existingSeller = await seller_schema_1.Seller.findOne({
        userId: existingUser._id,
    })
        .select("_id userId")
        .lean();
    if (!existingSeller) {
        throw new appError_2.AppError("You are not valid seller", 400);
    }
    const existingOTP = await seller_opt_schema_1.Otp.findOne({
        userId: existingSeller.userId,
    }).lean();
    if (existingOTP)
        throw new appError_2.AppError("OTP already exist", 409);
    const session = await (0, mongoose_1.startSession)();
    try {
        session.startTransaction();
        const [newOTP] = await seller_opt_schema_1.Otp.create([
            {
                userId: existingSeller.userId,
                otp: (0, helper_1.generateOPT)(),
                expiresAt: new Date(Date.now() + 2 * 60 * 1000),
            },
        ], { session });
        if (!newOTP)
            throw new appError_2.AppError("Failed to create OTP", 500);
        try {
            await (0, email_services_1.sendEmail)({
                to: existingUser.email,
                subject: "Email Verification",
                html: (0, otp_template_1.otpTemplate)(existingUser.name, newOTP.otp),
            });
        }
        catch (error) {
            console.error("Email Error:", {
                message: error.message,
                code: error.code,
                responseCode: error.responseCode,
                command: error.command,
                response: error.response,
            });
            throw new appError_2.AppError("Failed to send verification email", 500);
        }
        await session.commitTransaction();
        return existingSeller;
    }
    catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        await session.endSession();
    }
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
    const [existingUser, existingSession] = await Promise.all([
        user_schema_1.default.findById(userId).lean(),
        auth_schema_1.default.findById(sessionId).lean(),
    ]);
    if (!existingUser)
        throw new appError_2.AppError("User not found", 404);
    if (!existingSession)
        throw new appError_2.AppError("session not found", 401);
    const PROFILE_FIELDS = "name email phone role sellerId isActive emailVerified profileId profileType lastLogin createdAt updatedAt";
    const filter = { _id: userId, isActive: true };
    const user = await user_schema_1.default.findOne(filter)
        .select(PROFILE_FIELDS)
        .populate("sellerId")
        .populate("profileId")
        .lean();
    if (!user) {
        throw new appError_2.AppError("User not found or inactive", 400);
    }
    return user;
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
    registerSeller,
    verifySellerOPT,
    resendOPT,
};
//# sourceMappingURL=auth.service.js.map