import { Types } from "mongoose";
import { GetCustomerQuery } from "./customer.validation";
export declare const getCustomerList: (query: GetCustomerQuery, companyId: Types.ObjectId) => Promise<{
    customers: (import("./customer.interface").ICustomerDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[];
    total: number;
    page: number;
    limit: number;
}>;
//# sourceMappingURL=customer.service.d.ts.map