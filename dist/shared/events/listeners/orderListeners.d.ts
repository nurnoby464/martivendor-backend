import { IOrderDocument } from "../../../CRM/order/order.interface";
import { Types } from "mongoose";
export declare function handleOrderCreated(payload: {
    order: IOrderDocument;
    customerId: Types.ObjectId;
    sellerId: Types.ObjectId;
}): Promise<void>;
//# sourceMappingURL=orderListeners.d.ts.map