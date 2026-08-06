import { z } from "zod";
declare const AddressSchema: z.ZodObject<{
    label: z.ZodString;
    district: z.ZodString;
    area: z.ZodString;
    zip: z.ZodOptional<z.ZodString>;
    isDefault: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const validateOTPSchema: z.ZodObject<{
    email: z.ZodPipe<z.ZodString, z.ZodEmail>;
    otp: z.ZodString;
}, z.core.$strip>;
export declare const resendOTPSchema: z.ZodObject<{
    email: z.ZodPipe<z.ZodString, z.ZodEmail>;
}, z.core.$strip>;
export declare const CustomerUpdateSchema: z.ZodObject<{
    userData: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        image: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    }, z.core.$strip>>;
    profileData: z.ZodOptional<z.ZodObject<{
        gender: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodEnum<{
            male: "male";
            female: "female";
            other: "other";
        }>>>>;
        dob: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
        addresses: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            district: z.ZodString;
            area: z.ZodString;
            zip: z.ZodOptional<z.ZodString>;
            isDefault: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>>>>;
    }, z.core.$strip>>;
    role: z.ZodLiteral<"customer">;
    profileType: z.ZodLiteral<"Customer">;
    profileId: z.ZodString;
}, z.core.$strip>;
export declare const StaffUpdateSchema: z.ZodObject<{
    userData: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        image: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    }, z.core.$strip>>;
    profileData: z.ZodOptional<z.ZodObject<{
        address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        designation: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        department: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        joining_date: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>;
    role: z.ZodLiteral<"staff">;
    profileType: z.ZodLiteral<"Staff">;
    profileId: z.ZodString;
}, z.core.$strip>;
export declare const UpdateProfileSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    userData: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        image: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    }, z.core.$strip>>;
    profileData: z.ZodOptional<z.ZodObject<{
        gender: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodEnum<{
            male: "male";
            female: "female";
            other: "other";
        }>>>>;
        dob: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
        addresses: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            district: z.ZodString;
            area: z.ZodString;
            zip: z.ZodOptional<z.ZodString>;
            isDefault: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>>>>;
    }, z.core.$strip>>;
    role: z.ZodLiteral<"customer">;
    profileType: z.ZodLiteral<"Customer">;
    profileId: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    userData: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        image: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    }, z.core.$strip>>;
    profileData: z.ZodOptional<z.ZodObject<{
        address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        designation: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        department: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        joining_date: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>;
    role: z.ZodLiteral<"staff">;
    profileType: z.ZodLiteral<"Staff">;
    profileId: z.ZodString;
}, z.core.$strip>], "role">;
export type IUpdateProfileRequest = z.infer<typeof UpdateProfileSchema>;
export type ICustomerUpdateRequest = z.infer<typeof CustomerUpdateSchema>;
export type IStaffUpdateRequest = z.infer<typeof StaffUpdateSchema>;
export type IAddressInput = z.infer<typeof AddressSchema>;
export type IValidateOTPInput = z.infer<typeof validateOTPSchema>;
export type IResendOTPInput = z.infer<typeof resendOTPSchema>;
export {};
//# sourceMappingURL=auth.validation.d.ts.map