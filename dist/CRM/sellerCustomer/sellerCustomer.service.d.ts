import { Types } from "mongoose";
import { GetCustomerQuery, UpdateStatusInput, UpdateTagInput } from "./sellerCustomer.validation";
export declare const getMyCustomers: (query: GetCustomerQuery, sellerId: Types.ObjectId) => Promise<{
    customers: (import("./sellerCustomer.interface").ISellerCustomerDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[];
    total: number;
    page: number;
    limit: number;
}>;
export declare const updateTags: (sellerCustomerId: Types.ObjectId, input: UpdateTagInput) => Promise<import("mongoose").Document<unknown, {}, import("./sellerCustomer.interface").ISellerCustomerDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./sellerCustomer.interface").ISellerCustomerDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const updateStatus: (sellerCustomerId: Types.ObjectId, input: UpdateStatusInput) => Promise<import("mongoose").Document<unknown, {}, import("./sellerCustomer.interface").ISellerCustomerDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./sellerCustomer.interface").ISellerCustomerDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
//# sourceMappingURL=sellerCustomer.service.d.ts.map