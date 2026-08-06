import { ISessionDocument } from "./auth.interface";
import z from "zod";
declare const Session: import("mongoose").Model<ISessionDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, ISessionDocument, {}, import("mongoose").DefaultSchemaOptions> & ISessionDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ISessionDocument>;
export default Session;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodEmail;
    password: z.ZodString;
}, z.core.$strip>;
export declare const updatePasswordSchema: z.ZodObject<{
    oldPassword: z.ZodString;
    newPassword: z.ZodString;
}, z.core.$strip>;
export declare const sessionParamsSchema: z.ZodObject<{
    userId: z.ZodString;
    sessionId: z.ZodString;
}, z.core.$strip>;
//# sourceMappingURL=auth.schema.d.ts.map