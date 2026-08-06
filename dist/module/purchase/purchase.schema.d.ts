import { IPurchaseDocument } from "./purchase.interface";
declare const Purchase: import("mongoose").Model<IPurchaseDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IPurchaseDocument, {}, import("mongoose").DefaultSchemaOptions> & IPurchaseDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IPurchaseDocument>;
export default Purchase;
//# sourceMappingURL=purchase.schema.d.ts.map