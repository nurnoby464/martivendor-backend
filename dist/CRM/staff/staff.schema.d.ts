import { IStaffDocument } from "./staff.interface";
declare const Staff: import("mongoose").Model<IStaffDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IStaffDocument, {}, import("mongoose").DefaultSchemaOptions> & IStaffDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IStaffDocument>;
export default Staff;
//# sourceMappingURL=staff.schema.d.ts.map