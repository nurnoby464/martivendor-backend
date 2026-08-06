import mongoose, { Types } from "mongoose";
import { CreateSaleInput } from "./sales.validation";
interface ICreateSalePayload {
    sellerId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId | null;
    input: CreateSaleInput;
    createdByType: "staff" | "system";
}
export declare const createSale: (payload: ICreateSalePayload) => Promise<(mongoose.Document<unknown, {}, import("./sales.interface").ISaleDocument, {}, mongoose.DefaultSchemaOptions> & import("./sales.interface").ISaleDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}) | undefined>;
export {};
//# sourceMappingURL=sales.service.d.ts.map