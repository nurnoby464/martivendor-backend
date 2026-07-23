import { IUserDocument } from "./user.interface";
declare const User: import("mongoose").Model<IUserDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IUserDocument, {}, import("mongoose").DefaultSchemaOptions> & IUserDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUserDocument>;
export default User;
//# sourceMappingURL=user.schema.d.ts.map