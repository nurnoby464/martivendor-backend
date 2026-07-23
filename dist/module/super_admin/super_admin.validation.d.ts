import { z } from "zod";
import { createNewCompanySchema } from "../company/company.validation";
export declare const createUserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodEmail;
    password: z.ZodString;
    role: z.ZodEnum<{
        report: "report";
        sales: "sales";
        inventory: "inventory";
        site_management: "site_management";
        account: "account";
        admin: "admin";
        super_admin: "super_admin";
    }>;
    sellerId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    is_active: z.ZodOptional<z.ZodBoolean>;
    createdBy: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const registerCustomerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodEmail;
    password: z.ZodString;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const checkoutSchema: z.ZodObject<{
    body: z.ZodObject<{
        phone: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateNewCompanyInput = z.infer<typeof createNewCompanySchema>;
//# sourceMappingURL=super_admin.validation.d.ts.map