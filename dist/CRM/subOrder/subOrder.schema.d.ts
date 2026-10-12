import { ISubOrderDocument } from "./subOrder.interface";
declare const SubOrder: import("mongoose").Model<ISubOrderDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, ISubOrderDocument, {}, import("mongoose").DefaultSchemaOptions> & ISubOrderDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ISubOrderDocument>;
export default SubOrder;
//# sourceMappingURL=subOrder.schema.d.ts.map