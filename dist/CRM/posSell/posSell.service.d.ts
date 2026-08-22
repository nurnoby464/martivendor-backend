import mongoose, { Types } from "mongoose";
import { CreateSaleInput } from "./posSell.validation";
interface ICreateSalePayload {
    sellerId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId | null;
    input: CreateSaleInput;
    createdByType: "staff" | "system";
}
export declare const createSale: (payload: ICreateSalePayload) => Promise<mongoose.Document<unknown, {}, import("./posSell.interface").ISaleDocument, {}, mongoose.DefaultSchemaOptions> & import("./posSell.interface").ISaleDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export {};
//# sourceMappingURL=posSell.service.d.ts.map