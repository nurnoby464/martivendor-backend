"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProfileSchema = exports.StaffUpdateSchema = exports.CustomerUpdateSchema = exports.resendOTPSchema = exports.validateOTPSchema = void 0;
const zod_1 = require("zod");
// Address Schema
const AddressSchema = zod_1.z.object({
    //   _id: z.string().optional(),
    label: zod_1.z.string().min(1, "Label is required"),
    district: zod_1.z.string().min(1, "District is required"),
    area: zod_1.z.string().min(1, "Area is required"),
    zip: zod_1.z.string().optional(),
    isDefault: zod_1.z.boolean().default(false),
});
// User Data Schema
const UserDataSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(2, "Name must be at least 2 characters").optional(),
    phone: zod_1.z
        .string()
        .regex(/^01[3-9]\d{8}$/, "Invalid Bangladesh phone number")
        .optional(),
    image: zod_1.z.string().url("Invalid image URL").optional().nullable(),
})
    .partial();
// Customer Profile Data Schema
const CustomerProfileDataSchema = zod_1.z
    .object({
    gender: zod_1.z.enum(["male", "female", "other"]).optional().nullable(),
    dob: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
        .optional()
        .nullable(),
    addresses: zod_1.z.array(AddressSchema).optional(),
})
    .partial();
// Staff Profile Data Schema
const StaffProfileDataSchema = zod_1.z
    .object({
    address: zod_1.z
        .string()
        .min(5, "Address must be at least 5 characters")
        .optional(),
    designation: zod_1.z.string().min(2, "Designation is required").optional(),
    department: zod_1.z.string().min(2, "Department is required").optional(),
    joining_date: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
        .optional(),
})
    .partial();
exports.validateOTPSchema = zod_1.z.object({
    email: zod_1.z.string().trim().toLowerCase().pipe(zod_1.z.email("Enter a valid email")),
    otp: zod_1.z.string().trim(),
});
exports.resendOTPSchema = zod_1.z.object({
    email: zod_1.z.string().trim().toLowerCase().pipe(zod_1.z.email("Enter a valid email")),
});
// Customer Update Schema
exports.CustomerUpdateSchema = zod_1.z
    .object({
    userData: UserDataSchema.optional(),
    profileData: CustomerProfileDataSchema.optional(),
    role: zod_1.z.literal("customer"),
    profileType: zod_1.z.literal("Customer"),
    profileId: zod_1.z.string().min(1, "Profile ID is required"),
})
    .refine((data) => Object.keys(data.userData || {}).length > 0 ||
    Object.keys(data.profileData || {}).length > 0, { message: "At least one field must be updated" });
// Staff Update Schema
exports.StaffUpdateSchema = zod_1.z
    .object({
    userData: UserDataSchema.optional(),
    profileData: StaffProfileDataSchema.optional(),
    role: zod_1.z.literal("staff"),
    profileType: zod_1.z.literal("Staff"),
    profileId: zod_1.z.string().min(1, "Profile ID is required"),
})
    .refine((data) => Object.keys(data.userData || {}).length > 0 ||
    Object.keys(data.profileData || {}).length > 0, { message: "At least one field must be updated" });
// Combined Schema
exports.UpdateProfileSchema = zod_1.z.discriminatedUnion("role", [
    exports.CustomerUpdateSchema,
    exports.StaffUpdateSchema,
]);
//# sourceMappingURL=auth.validation.js.map