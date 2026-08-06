import mongoose, { Types } from "mongoose";
export declare const getByOrderId: (orderId: Types.ObjectId) => Promise<mongoose.Document<unknown, {}, import("./invoice.interface").IInvoiceDocument, {}, mongoose.DefaultSchemaOptions> & import("./invoice.interface").IInvoiceDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
//# sourceMappingURL=invoice.service.d.ts.map