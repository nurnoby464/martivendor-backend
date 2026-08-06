import { Types } from "mongoose";
export interface IOtp {
    userId: Types.ObjectId;
    otp: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=seller.otp.interface.d.ts.map