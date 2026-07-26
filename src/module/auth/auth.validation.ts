import { email, z } from "zod";

// Address Schema
const AddressSchema = z.object({
  //   _id: z.string().optional(),
  label: z.string().min(1, "Label is required"),
  district: z.string().min(1, "District is required"),
  area: z.string().min(1, "Area is required"),
  zip: z.string().optional(),
  isDefault: z.boolean().default(false),
});

// User Data Schema
const UserDataSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    phone: z
      .string()
      .regex(/^01[3-9]\d{8}$/, "Invalid Bangladesh phone number")
      .optional(),
    image: z.string().url("Invalid image URL").optional().nullable(),
  })
  .partial();

// Customer Profile Data Schema
const CustomerProfileDataSchema = z
  .object({
    gender: z.enum(["male", "female", "other"]).optional().nullable(),
    dob: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
      .optional()
      .nullable(),
    addresses: z.array(AddressSchema).optional(),
  })
  .partial();

// Staff Profile Data Schema
const StaffProfileDataSchema = z
  .object({
    address: z
      .string()
      .min(5, "Address must be at least 5 characters")
      .optional(),
    designation: z.string().min(2, "Designation is required").optional(),
    department: z.string().min(2, "Department is required").optional(),
    joining_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
      .optional(),
  })
  .partial();
  
export const validateOTPSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  otp: z.string().trim(),
});

// Customer Update Schema
export const CustomerUpdateSchema = z
  .object({
    userData: UserDataSchema.optional(),
    profileData: CustomerProfileDataSchema.optional(),
    role: z.literal("customer"),
    profileType: z.literal("Customer"),
    profileId: z.string().min(1, "Profile ID is required"),
  })
  .refine(
    (data) =>
      Object.keys(data.userData || {}).length > 0 ||
      Object.keys(data.profileData || {}).length > 0,
    { message: "At least one field must be updated" },
  );

// Staff Update Schema
export const StaffUpdateSchema = z
  .object({
    userData: UserDataSchema.optional(),
    profileData: StaffProfileDataSchema.optional(),
    role: z.literal("staff"),
    profileType: z.literal("Staff"),
    profileId: z.string().min(1, "Profile ID is required"),
  })
  .refine(
    (data) =>
      Object.keys(data.userData || {}).length > 0 ||
      Object.keys(data.profileData || {}).length > 0,
    { message: "At least one field must be updated" },
  );

// Combined Schema
export const UpdateProfileSchema = z.discriminatedUnion("role", [
  CustomerUpdateSchema,
  StaffUpdateSchema,
]);

// Type exports
export type IUpdateProfileRequest = z.infer<typeof UpdateProfileSchema>;
export type ICustomerUpdateRequest = z.infer<typeof CustomerUpdateSchema>;
export type IStaffUpdateRequest = z.infer<typeof StaffUpdateSchema>;
export type IAddressInput = z.infer<typeof AddressSchema>;
export type IValidateOTPInput = z.infer<typeof validateOTPSchema>;
