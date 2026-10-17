import mongoose, { Types } from "mongoose";
import { CreateCustomerInput, GetCustomerQuery } from "./customer.validation";
export declare const getCustomerList: (query: GetCustomerQuery, sellerId: Types.ObjectId) => Promise<{
    customers: (import("./customer.interface").ICustomerDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[];
    total: number;
    page: number;
    limit: number;
}>;
export declare const createCustomer: (input: CreateCustomerInput) => Promise<mongoose.Document<unknown, {}, import("./customer.interface").ICustomerDocument, {}, mongoose.DefaultSchemaOptions> & import("./customer.interface").ICustomerDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
//# sourceMappingURL=customer.service.d.ts.map