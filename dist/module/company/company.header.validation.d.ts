import { z } from "zod";
export declare const UpdateNavItemSchema: z.ZodObject<{
    _id: z.ZodString;
    label: z.ZodOptional<z.ZodString>;
    keyword: z.ZodOptional<z.ZodString>;
    sectionTitle: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodNumber>;
    isActiveInNav: z.ZodOptional<z.ZodBoolean>;
    showOnHomepage: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const DeleteNavItemSchema: z.ZodObject<{
    id: z.ZodString;
    navItemId: z.ZodString;
}, z.core.$strip>;
export declare const UpdateParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const ChangeNavItemOrderSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        _id: z.ZodString;
        order: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const ReorderNavItemsBodySchema: z.ZodObject<{
    navItems: z.ZodArray<z.ZodObject<{
        _id: z.ZodString;
        order: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type TDeleteNavItem = z.infer<typeof DeleteNavItemSchema>;
export type TChangeNavItemOrder = z.infer<typeof ChangeNavItemOrderSchema>;
export type TUpdateNavItem = z.infer<typeof UpdateNavItemSchema>;
export declare const CreateNavItemSchema: z.ZodObject<{
    label: z.ZodString;
    keyword: z.ZodOptional<z.ZodString>;
    sectionTitle: z.ZodOptional<z.ZodString>;
    order: z.ZodNumber;
    isActiveInNav: z.ZodBoolean;
    showOnHomepage: z.ZodBoolean;
}, z.core.$strip>;
export type TCreateNavItem = z.infer<typeof CreateNavItemSchema>;
export type TReorderNavItems = z.infer<typeof ReorderNavItemsBodySchema>;
//# sourceMappingURL=company.header.validation.d.ts.map