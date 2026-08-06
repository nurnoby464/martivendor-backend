import { ICustomerDocument } from "./customer.interface";
declare const Customer: import("mongoose").Model<ICustomerDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, ICustomerDocument, {}, import("mongoose").DefaultSchemaOptions> & ICustomerDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICustomerDocument>;
export default Customer;
//# sourceMappingURL=customer.schema.d.ts.map