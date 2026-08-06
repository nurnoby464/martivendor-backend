import mongoose, { Document } from "mongoose";
export interface ISession {
    userId: mongoose.Types.ObjectId;
    valid: boolean;
    user_agent: string | null;
    ip: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface ISessionDocument extends ISession, Document {
}
//# sourceMappingURL=auth.interface.d.ts.map