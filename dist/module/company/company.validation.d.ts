import z from "zod";
export declare const createNewCompanySchema: z.ZodObject<{
    company_name: z.ZodString;
    company_email: z.ZodEmail;
    phone: z.ZodString;
    address: z.ZodString;
    logo: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    domain: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    subdomain: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodDefault<z.ZodEnum<{
        active: "active";
        inactive: "inactive";
        suspended: "suspended";
    }>>;
    password: z.ZodString;
}, z.core.$strip>;
export declare const createCompanyUserSchema: z.ZodObject<{
    companyId: z.ZodOptional<z.ZodString>;
    email: z.ZodEmail;
    name: z.ZodString;
    role: z.ZodEnum<{
        report: "report";
        sales: "sales";
        inventory: "inventory";
        site_management: "site_management";
        account: "account";
    }>;
    password: z.ZodString;
}, z.core.$strip>;
export declare const companyParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const companyQuerySchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    limit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<1 | -1, string | undefined>>;
    search: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        active: "active";
        inactive: "inactive";
        suspended: "suspended";
    }>>;
}, z.core.$strip>;
export declare const updateCompanySchema: z.ZodObject<{
    company_name: z.ZodOptional<z.ZodString>;
    companyNavName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    logo: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    domain: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    subdomain: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<{
        active: "active";
        inactive: "inactive";
        suspended: "suspended";
    }>>;
}, z.core.$strip>;
export declare const userQuerySchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    limit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    search: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<{
        report: "report";
        sales: "sales";
        inventory: "inventory";
        site_management: "site_management";
        account: "account";
        admin: "admin";
    }>>;
    is_active: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<boolean | undefined, string | undefined>>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        email: "email";
        name: "name";
        role: "role";
        createdAt: "createdAt";
    }>>>;
    sortOrder: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<1 | -1, string | undefined>>;
    sellerId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const userParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const updateUserSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    is_active: z.ZodOptional<z.ZodBoolean>;
    role: z.ZodOptional<z.ZodEnum<{
        report: "report";
        sales: "sales";
        inventory: "inventory";
        site_management: "site_management";
        account: "account";
        admin: "admin";
    }>>;
}, z.core.$strip>;
export declare const updateSocialMediaSchema: z.ZodObject<{
    social_media: z.ZodOptional<z.ZodObject<{
        facebook: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">]>>>;
        instagram: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">]>>>;
        twitter: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">]>>>;
        youtube: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">]>>>;
        tiktok: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">]>>>;
        linkedin: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">]>>>;
        whatsapp: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">]>>>;
        pinterest: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">]>>>;
        website: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">]>>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type UpdateSocialMediaInput = z.infer<typeof updateSocialMediaSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CreateCompanyInput = z.infer<typeof createNewCompanySchema>;
export type CompanyQueryInput = z.infer<typeof companyQuerySchema>;
export type CompanyUserInput = z.infer<typeof createCompanyUserSchema>;
//# sourceMappingURL=company.validation.d.ts.map