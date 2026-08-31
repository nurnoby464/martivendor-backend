import z from "zod";
export declare const notificationIdParamSchema: z.ZodObject<{
    notificationId: z.ZodString;
}, z.core.$strip>;
export declare const notificationQuerySchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodString>;
    isRead: z.ZodOptional<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const notificationMarkMultipleSchema: z.ZodObject<{
    notificationIds: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type INotificationMarkMultipleInput = z.infer<typeof notificationMarkMultipleSchema>;
export type INotificationQueryInput = z.infer<typeof notificationQuerySchema>;
//# sourceMappingURL=notification.validation.d.ts.map