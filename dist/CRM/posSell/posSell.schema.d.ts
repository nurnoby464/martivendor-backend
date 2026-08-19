import { ISaleDocument } from "./posSell.interface";
declare const PosSale: import("mongoose").Model<ISaleDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, ISaleDocument, {}, import("mongoose").DefaultSchemaOptions> & ISaleDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ISaleDocument>;
export default PosSale;
//# sourceMappingURL=posSell.schema.d.ts.map