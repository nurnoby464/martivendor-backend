import { IInvoiceDocument } from "./invoice.interface";
declare const Invoice: import("mongoose").Model<IInvoiceDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IInvoiceDocument, {}, import("mongoose").DefaultSchemaOptions> & IInvoiceDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IInvoiceDocument>;
export default Invoice;
//# sourceMappingURL=invoice.schema.d.ts.map