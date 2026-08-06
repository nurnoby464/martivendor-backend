import { Types } from "mongoose";
interface ICalculateDiscount {
    sellingPrice: number;
    quantity: number;
    discountType: "flat" | "percentage" | null;
    discountValue: number;
}
export declare const generateOderNumber: (sellerId: Types.ObjectId) => Promise<string>;
export declare const generateInvoiceNumber: () => Promise<string>;
export declare const calculateDiscount: (data: ICalculateDiscount) => number;
export {};
//# sourceMappingURL=healper.d.ts.map