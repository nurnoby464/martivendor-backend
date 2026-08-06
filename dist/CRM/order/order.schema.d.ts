import { IOrderDocument } from "./order.interface";
declare const Order: import("mongoose").Model<IOrderDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IOrderDocument, {}, import("mongoose").DefaultSchemaOptions> & IOrderDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IOrderDocument>;
export default Order;
//# sourceMappingURL=order.schema.d.ts.map