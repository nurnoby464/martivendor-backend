import {
  ISessionPublic,
  SessionLimitError,
} from "./../../middlewares/appError";
import mongoose, { ObjectId, startSession, Types } from "mongoose";
import { jwtConfig } from "./../../config/jwt.config";
import { Request } from "express";
import { AppError } from "../../middlewares/appError";
import { ITokenPayload, JwtHelper } from "../../utils/jwtHelper";
import User from "../user/user.schema";
import { Secret } from "jsonwebtoken";
import Session from "./auth.schema";
import { enforceSessionLimit } from "../../utils/sessionHelper";
import {
  RegisterCustomerInput,
  RegisterSellerInput,
} from "../user/user.validation";
import { generateOPT, makeLoginResponse, makeToken } from "../../utils/helper";
import {
  IResendOTPInput,
  IUpdateProfileRequest,
  IValidateOTPInput,
} from "./auth.validation";
import Staff from "../../CRM/staff/staff.schema";
import Customer from "../../CRM/customer/customer.schema";
import { IUser, IUserDocument } from "../user/user.interface";
import { Seller } from "../seller/seller.schema";
import { Otp } from "../seller/seller.opt.schema";
import { sendEmail } from "../../utils/email.services";
import { otpTemplate } from "../../templates/otp.template";

interface ILogin {
  email: string;
  password: string;
}
interface IUpdatePassword {
  oldPassword: string;
  newPassword: string;
  userId: string;
  sessionId: string;
}
const login = async (payload: ILogin, req: Request) => {
  const MAX_SESSIONS = 6;
  const { email, password } = payload;
  const existing = await User.findOne({ email, isActive: true }).select(
    "+password",
  );
  if (!existing) {
    throw new AppError("This email user not found", 400);
  }
  const isMatch = await existing.comparePassword(password);
  if (!isMatch) {
    throw new AppError("Password incorrect!", 400);
  }
  //check session limit
  const activeSessions = await Session.find({
    userId: existing._id,
    valid: true,
  })
    .sort({ updatedAt: -1 }) // newest first for display
    .select("_id user_agent userId ip createdAt updatedAt")
    .lean();
  if (activeSessions.length >= MAX_SESSIONS) {
    const sessionList: ISessionPublic[] = activeSessions?.map((session) => ({
      sessionId: session._id.toString(),
      user_agent: session.user_agent,
      userId: session.userId.toString(),
      ip: session.ip,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }));
    throw new SessionLimitError(sessionList);
  }
  // await enforceSessionLimit(existing._id);

  // Layer 1 — reuse or create session
  const session = await Session.findOneAndUpdate(
    {
      userId: existing._id,
      valid: true,
      user_agent: req.headers["user-agent"] ?? null,
    },
    {
      $set: {
        ip: req.ip ?? null,
      },
      $setOnInsert: {
        userId: existing._id,
        valid: true,
        user_agent: req.headers["user-agent"] ?? null,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      runValidators: true,
    },
  );
  if (!session) {
    throw new AppError("Session created failed");
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

  const data = makeToken({ existing, session });

  const accessToken = await JwtHelper.generateToken({
    data,
    secret: jwtConfig.access.secret as Secret,
    expiresIn: jwtConfig.access.expiresIn,
  });
  const refreshToken = await JwtHelper.generateToken({
    data,
    secret: jwtConfig.refresh.secret,
    expiresIn: jwtConfig.refresh.expiresIn,
  });
  const result = await User.findByIdAndUpdate(
    existing._id,
    { last_login: new Date() },
    { returnDocument: "after", runValidators: true },
  );
  if (!result) {
    throw new AppError("Last login not updated");
  }

  const user = result.toJSON();

  const response = await makeLoginResponse({ user });
  return {
    user: response,
    accessToken,
    refreshToken,
  };
};

// ─── Logout ───────────────────────────────────────────────
const logout = async (refreshToken: string) => {
  if (!refreshToken) throw new AppError("Already logged out", 400);
  const decoded = JwtHelper.verifyToken({
    token: refreshToken,
    secret: jwtConfig.refresh.secret,
  });
  if (!decoded) {
    throw new AppError("Token data not found", 400);
  }
  await Session.findByIdAndUpdate(decoded.sessionId, {
    valid: false,
  });
};

// ─── Refresh ──────────────────────────────────────────────
const refresh = async (refreshToken: string) => {
  // 1. verify refresh token
  let decoded: { sessionId: string };
  try {
    decoded = JwtHelper.verifyToken({
      token: refreshToken,
      secret: jwtConfig.refresh.secret,
    }) as { sessionId: string };
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }
  // 2. find session
  const session = await Session.findById(decoded.sessionId);
  if (!session || !session.valid) {
    throw new AppError("Session expired. Please log in again", 401);
  }

  // 3. find user
  const user = await User.findOne({ _id: session.userId, isActive: true });
  if (!user) {
    throw new AppError("User no longer exists", 401);
  }

  // 4. issue new access token
  const data = makeToken({ existing: user, session });
  const newAccessToken = JwtHelper.generateToken({
    data,
    secret: jwtConfig.access.secret,
    expiresIn: jwtConfig.access.expiresIn,
  });

  return { accessToken: newAccessToken };
};
const removeSession = async (sessionId: string, userId: string) => {
  const session = await Session.findOneAndDelete({
    _id: new Types.ObjectId(sessionId),
    userId: new Types.ObjectId(userId),
  });
  if (!session) throw new AppError("Session not found", 404);
};

const updatePassword = async (payload: IUpdatePassword) => {
  const { userId, sessionId, oldPassword, newPassword } = payload;
  const user = await User.findOne({
    _id: new Types.ObjectId(userId),
    is_active: true,
  }).select("+password");
  if (!user) throw new AppError("User not found", 404);
  // check old password
  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) throw new AppError("Current password is incorrect", 400);
  // check new password is same as old password
  const isSame = await user.comparePassword(newPassword);
  if (isSame) {
    throw new AppError("New password must be different from old password", 400);
  }

  // update password

  user.password = newPassword;
  user.passwordChangedAt = new Date();
  await user.save();

  await Session.deleteMany({
    userId: user._id,
    _id: { $ne: new Types.ObjectId(sessionId) },
  });
  return {
    message: "Password updated. All other sessions have been logged out.",
  };
};

const registerSeller = async (input: RegisterSellerInput) => {
  const { name, phone, email, password, shopName } = input;
  const slug = shopName
    .toLowerCase()
    .replace(/'/g, "") // Remove apostrophes
    .replace(/&/g, " ") // Replace & with space
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with -
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

  // 1. check duplicate phone under same company

  const [existingUser, existingSeller] = await Promise.all([
    User.findOne({
      email,
      role: "seller",
    }),
    Seller.findOne({
      slug,
    }),
  ]);
  if (existingUser) {
    throw new AppError("This email already registered", 409);
  }
  if (existingSeller) {
    throw new AppError("Shop name is already taken, choose another", 409);
  }
  const id = new Types.ObjectId();
  const session = await startSession();
  try {
    session.startTransaction();
    const [user] = await User.create(
      [
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
      ],
      { session },
    );
    if (!user) {
      throw new AppError("Failed to create user", 500);
    }
    const [seller] = await Seller.create(
      [
        {
          _id: id,
          userId: user._id,
          isPlatform: false,
          name: shopName,
          slug,
        },
      ],
      { session },
    );
    if (!seller) {
      throw new AppError("Failed to create seller");
    }
    const result = await Otp.findOneAndUpdate(
      { userId: seller.userId },
      { otp: generateOPT() },
      { upsert: true, runValidators: true, returnDocument: "after", session },
    );

    if (!result) throw new AppError("Failed to create OTP", 500);
    try {
      await sendEmail({
        to: email,
        subject: "Email Verification",
        html: otpTemplate(name, result.otp),
      });
    } catch (error: any) {
      console.error("Email Error:", {
        message: error.message,
        code: error.code,
        responseCode: error.responseCode,
        command: error.command,
        response: error.response,
      });

      throw new AppError("Failed to send verification email", 500);
    }
    // now send OPT to email.  i will finish letter
    await session.commitTransaction();
    return seller;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const verifySellerOPT = async (payload: IValidateOTPInput) => {
  const { email, otp } = payload;
  const existingUser = await User.findOne({
    email,
    isActive: true,
    role: "seller",
  })
    .select("_id")
    .lean();
  if (!existingUser) {
    throw new AppError("User not found with this email", 404);
  }
  const existingSeller = await Seller.findOne({
    userId: existingUser._id,
    status: { $nin: ["rejected", "suspended"] },
  })
    .select("_id userId")
    .lean();
  if (!existingSeller) {
    throw new AppError("You are not valid seller", 400);
  }

  const existingOTP = await Otp.findOne({
    userId: existingSeller.userId,
  }).lean();
  console.log(existingOTP);
  if (!existingOTP) throw new AppError("OTP not found", 404);
  if (existingOTP.expiresAt < new Date()) {
    throw new Error("OTP has expired");
  }
  if (existingOTP.otp !== otp) throw new AppError("Incorrect OTP", 400);

  const session = await startSession();
  try {
    session.startTransaction();
    const updateUser = await User.findOneAndUpdate(
      {
        email,
        role: "seller",
        isActive: true,
      },
      {
        $set: {
          emailVerified: true,
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
        session,
      },
    );
    if (!updateUser) {
      throw new AppError("Email not verified", 500);
    }
    const updateSeller = await Seller.findOneAndUpdate(
      { userId: updateUser._id, status: { $nin: ["rejected", "suspended"] } },
      { $set: { status: "approved" } },
      { returnDocument: "after", runValidators: true, session },
    );

    if (!updateSeller) {
      const currentSeller = await Seller.findOne({ userId: updateUser._id })
        .select("status")
        .session(session)
        .lean();

      if (!currentSeller) {
        throw new AppError("Seller not found", 404);
      }

      throw new AppError(
        `Seller cannot be approved. Current status: ${currentSeller.status}`,
        409, // conflict — state changed under you, not a server error
      );
    }
    await session.commitTransaction();
    return updateSeller;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const resendOPT = async (payload: IResendOTPInput) => {
  const { email } = payload;
  console.log(email);
  const existingUser = await User.findOne({
    email,
    isActive: true,
    role: "seller",
  })
    .select("_id name email")
    .lean();
  if (!existingUser) {
    throw new AppError("User not found with this email", 404);
  }
  const existingSeller = await Seller.findOne({
    userId: existingUser._id,
  })
    .select("_id userId")
    .lean();
  if (!existingSeller) {
    throw new AppError("You are not valid seller", 400);
  }
  const existingOTP = await Otp.findOne({
    userId: existingSeller.userId,
  }).lean();
  if (existingOTP) throw new AppError("OTP already exist", 409);

  const session = await startSession();

  try {
    session.startTransaction();
    const [newOTP] = await Otp.create(
      [
        {
          userId: existingSeller.userId,
          otp: generateOPT(),
          expiresAt: new Date(Date.now() + 2 * 60 * 1000),
        },
      ],
      { session },
    );
    if (!newOTP) throw new AppError("Failed to create OTP", 500);
    try {
      await sendEmail({
        to: existingUser.email,
        subject: "Email Verification",
        html: otpTemplate(existingUser.name, newOTP.otp),
      });
    } catch (error: any) {
      console.error("Email Error:", {
        message: error.message,
        code: error.code,
        responseCode: error.responseCode,
        command: error.command,
        response: error.response,
      });
      throw new AppError("Failed to send verification email", 500);
    }

    await session.commitTransaction();
    return existingSeller;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};
const registerCustomer = async (
  sellerId: Types.ObjectId,
  input: RegisterCustomerInput,
) => {
  const { name, phone, email, password } = input;

  // 1. check duplicate phone under same company
  const existing = await User.findOne({
    sellerId,
    email,
    role: "customer",
  });
  if (existing) {
    throw new AppError("This email already registered", 409);
  }

  // 3. create user — NO customer CRM doc yet
  const user = await User.create({
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

export const getMe = async (
  userId: Types.ObjectId,
  sessionId: Types.ObjectId,
) => {
  const [existingUser, existingSession] = await Promise.all([
    User.findById(userId).lean(),
    Session.findById(sessionId).lean(),
  ]);
  if (!existingUser) throw new AppError("User not found", 404);
  if (!existingSession) throw new AppError("session not found", 401);

  const PROFILE_FIELDS =
    "name email phone role sellerId isActive emailVerified profileId profileType lastLogin createdAt updatedAt";
  const filter = { _id: userId, isActive: true };
  const user = await User.findOne(filter)
    .select(PROFILE_FIELDS)
    .populate("sellerId")
    .populate("profileId")
    .lean();
  if (!user) {
    throw new AppError("User not found or inactive", 400);
  }
  return user;
};

const updateProfile = async (
  companyId: Types.ObjectId,
  userId: Types.ObjectId,
  input: IUpdateProfileRequest,
) => {
  const { role, profileType, profileData, userData } = input;

  const session = await mongoose.startSession();
  try {
    await session.startTransaction();
    if (role === "customer") {
      const customer = await Customer.updateOne(
        { companyId, userId },
        {
          $set: { ...profileData, ...userData },
        },
        { session, runValidators: true },
      );
      if (customer.matchedCount === 0) {
        throw new AppError("Profile not found", 404);
      }
    } else {
      const staff = await Staff.updateOne(
        { companyId, userId },
        {
          $set: { ...profileData, ...userData },
        },
        { session, runValidators: true },
      );
      if (staff.matchedCount === 0) {
        throw new AppError("Profile not found", 404);
      }
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { name: userData?.name, phone: userData?.phone } },
      { session, returnDocument: "after", runValidators: true },
    );
    if (!user) {
      throw new AppError("User not found", 404);
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
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

export const AuthServices = {
  login,
  logout,
  refresh,
  removeSession,
  updatePassword,
  registerCustomer,
  getMe,
  updateProfile,
  registerSeller,
  verifySellerOPT,
  resendOPT,
};
