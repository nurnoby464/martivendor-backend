import { Types } from "mongoose";
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
export declare const createCustomer: (sellerId: Types.ObjectId, input: CreateCustomerInput) => Promise<never>;
//# sourceMappingURL=customer.service.d.ts.map