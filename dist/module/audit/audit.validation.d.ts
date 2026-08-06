import z from "zod";
export declare const createCompanySchema: z.ZodObject<{
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
}, z.core.$strip>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
//# sourceMappingURL=audit.validation.d.ts.map