import { Types } from "mongoose";
import { GetCustomerQuery } from "./staff.validation";
export declare const getCustomerList: (query: GetCustomerQuery, companyId: Types.ObjectId) => Promise<{
    customers: (import("./staff.interface").IStaffDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[];
    total: number;
}>;
//# sourceMappingURL=staff.service.d.ts.map