import { z } from "zod";
import { createNewCompanySchema } from "../seller/seller.validation";
export declare const createUserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodEmail;
    password: z.ZodString;
    role: z.ZodEnum<{
        user: "user";
    }>;
    sellerId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    createdBy: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const registerCustomerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodEmail;
    password: z.ZodString;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const registerSellerSchema: z.ZodObject<{
    name: z.ZodString;
    shopName: z.ZodString;
    email: z.ZodEmail;
    password: z.ZodString;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const checkoutSchema: z.ZodObject<{
    body: z.ZodObject<{
        phone: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const superAdminSchema: z.ZodObject<{
    name: z.ZodString;
    shopName: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodPipe<z.ZodString, z.ZodEmail>;
    password: z.ZodString;
}, z.core.$strip>;
export declare const userStatsQuerySchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    limit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    sortBy: z.ZodDefault<z.ZodEnum<{
        email: "email";
        phone: "phone";
        name: "name";
        role: "role";
        createdAt: "createdAt";
        updatedAt: "updatedAt";
    }>>;
    sortOrder: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<1 | -1, string | undefined>>;
    search: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        active: "active";
        inactive: "inactive";
        suspended: "suspended";
    }>>;
    role: z.ZodOptional<z.ZodEnum<{
        report: "report";
        sales: "sales";
        inventory: "inventory";
        site_management: "site_management";
        account: "account";
        admin: "admin";
        super_admin: "super_admin";
        seller: "seller";
        staff: "staff";
        seller_staff: "seller_staff";
        customer: "customer";
    }>>;
}, z.core.$strip>;
export declare const userDetailsQuerySchema: z.ZodObject<{
    profileType: z.ZodEnum<{
        Seller: "Seller";
        Customer: "Customer";
        Staff: "Staff";
        SellerStaff: "SellerStaff";
    }>;
    profileId: z.ZodString;
}, z.core.$strip>;
export type UserDetailsParams = z.infer<typeof userDetailsQuerySchema>;
export type UserStatsInput = z.infer<typeof userStatsQuerySchema>;
export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;
export type RegisterSellerInput = z.infer<typeof registerSellerSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateNewCompanyInput = z.infer<typeof createNewCompanySchema>;
export type CreateSuperAdminInput = z.infer<typeof superAdminSchema>;
//# sourceMappingURL=user.validation.d.ts.map