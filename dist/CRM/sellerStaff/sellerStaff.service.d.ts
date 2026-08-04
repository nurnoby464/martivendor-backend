import { Types } from "mongoose";
import { GetCustomerQuery } from "./sellerStaff.validation";
export declare const getCustomerList: (query: GetCustomerQuery, companyId: Types.ObjectId) => Promise<{
    customers: (import("../customer/customer.interface").ICustomerDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[];
    total: number;
}>;
//# sourceMappingURL=sellerStaff.service.d.ts.map