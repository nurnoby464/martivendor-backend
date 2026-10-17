import { IPaymentDocument } from "./payment.interface";
declare const Payment: import("mongoose").Model<IPaymentDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IPaymentDocument, {}, import("mongoose").DefaultSchemaOptions> & IPaymentDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IPaymentDocument>;
export default Payment;
//# sourceMappingURL=payment.schema.d.ts.map