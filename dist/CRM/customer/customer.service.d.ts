import { Types } from "mongoose";
import { CreateCustomerInput, GetCustomerQuery } from "./customer.validation";
export declare const getCustomerList: (query: GetCustomerQuery) => Promise<{
    customers: (import("./customer.interface").ICustomerDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[];
    total: number;
    page: number;
    limit: number;
}>;
export declare const createCustomer: (sellerId: Types.ObjectId, input: CreateCustomerInput) => Promise<{
    _id: Types.ObjectId;
    customerId: Types.ObjectId;
    name: string;
    phone: string;
    source: import("../sellerCustomer/sellerCustomer.interface").TCustomerSource;
    totalOrders: number;
    totalPurchased: number;
    totalPaid: number;
    due: number;
    credit: number;
    tags: never[];
    lastPurchasedAt: null;
}>;
//# sourceMappingURL=customer.service.d.ts.map