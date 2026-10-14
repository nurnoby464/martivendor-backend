import { model, Schema } from "mongoose";
import { IUserDocument, PROFILE_TYPE, USER_ROLES } from "./user.interface";
import bcrypt from "bcryptjs";
import Session from "../auth/auth.schema";

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    phone: {
      type: String,
      // default: null,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
      select: false,
    },

    role: {
      type: String,
      required: [true, "Role is required"],
      enum: {
        values: USER_ROLES, // ✅ runtime array
        message: "Invalid role: {VALUE}",
      },
    },

    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      default: null,
      // null for super_admin | set for admin and all role users
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    // Add these
    profileId: {
      type: Schema.Types.ObjectId,
      refPath: "profileType",
      default: null,
    },
    profileType: {
      type: String,
      enum: PROFILE_TYPE,
      default: null,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    lastLogin: { type: Date, default: null },
    resetToken: { type: String, default: null, select: false },
    resetTokenExp: { type: Date, default: null, select: false },
  },
  {
    timestamps: true,
  },
);

// ─── Indexes ─────────────────────────────────────────────
UserSchema.index({ sellerId: 1, role: 1 });
UserSchema.index({ createdBy: 1 });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index(
  { phone: 1 },
  { unique: true, partialFilterExpression: { phone: { $type: "string" } } },
);
UserSchema.index({ profileType: 1, profileId: 1 });

// ─── Virtual: sessions ────────────────────────────────────
// Lets you do user.populate("sessions") to get all sessions for this user.
// No data is stored on the User document itself.
UserSchema.virtual("sessions", {
  ref: "Session",
  localField: "_id",
  foreignField: "userId",
});

// ─── Pre-save: hash password ──────────────────────────────
UserSchema.pre<IUserDocument>("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ─── Method: compare password ─────────────────────────────
UserSchema.methods.comparePassword = async function (plainPassword: string) {
  return bcrypt.compare(plainPassword, this.password);
};

// ─── Method: invalidate all sessions ─────────────────────
// Call this on logout-all or password change to kill every active session.
UserSchema.methods.clearSessions = async function () {
  // const Session = (await import("./session.schema")).default;
  await Session.updateMany({ userId: this._id, valid: true }, { valid: false });
};

// ─── toJSON: strip sensitive fields ──────────────────────
UserSchema.set("toJSON", {
  virtuals: false, // don't expose sessions array by default in JSON
  transform: (_doc, ret) => {
    const obj = ret as any;
    delete obj.password;
    delete obj.reset_token;
    delete obj.reset_token_exp;
    return obj;
  },
});

const User = model<IUserDocument>("User", UserSchema);
export default User;
