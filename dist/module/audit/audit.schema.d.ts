import { IAuditDocument } from "./audit.interface";
declare const Audit: import("mongoose").Model<IAuditDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IAuditDocument, {}, import("mongoose").DefaultSchemaOptions> & IAuditDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IAuditDocument>;
export default Audit;
//# sourceMappingURL=audit.schema.d.ts.map