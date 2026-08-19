import { Schema } from "mongoose";
import { IVendorDocument } from "./vendor.interface";
export declare const VendorCounter: import("mongoose").Model<{
    sellerId: import("mongoose").Types.ObjectId;
    seq: number;
}, {}, {}, {
    id: string;
}, import("mongoose").Document<unknown, {}, {
    sellerId: import("mongoose").Types.ObjectId;
    seq: number;
}, {
    id: string;
}, {
    collection: string;
}> & Omit<{
    sellerId: import("mongoose").Types.ObjectId;
    seq: number;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, Schema<any, import("mongoose").Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    collection: string;
}, {
    sellerId: import("mongoose").Types.ObjectId;
    seq: number;
}, import("mongoose").Document<unknown, {}, {
    sellerId: import("mongoose").Types.ObjectId;
    seq: number;
}, {
    id: string;
}, Omit<import("mongoose").DefaultSchemaOptions, "collection"> & {
    collection: string;
}> & Omit<{
    sellerId: import("mongoose").Types.ObjectId;
    seq: number;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, unknown, {
    sellerId: import("mongoose").Types.ObjectId;
    seq: number;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>, {
    sellerId: import("mongoose").Types.ObjectId;
    seq: number;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
declare const Vendor: import("mongoose").Model<IVendorDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IVendorDocument, {}, import("mongoose").DefaultSchemaOptions> & IVendorDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IVendorDocument>;
export default Vendor;
//# sourceMappingURL=vendor.schema.d.ts.map