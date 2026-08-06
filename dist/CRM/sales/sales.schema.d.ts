import { ISaleDocument } from "./sales.interface";
declare const Sale: import("mongoose").Model<ISaleDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, ISaleDocument, {}, import("mongoose").DefaultSchemaOptions> & ISaleDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ISaleDocument>;
export default Sale;
//# sourceMappingURL=sales.schema.d.ts.map