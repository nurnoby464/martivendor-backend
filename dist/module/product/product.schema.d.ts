import { Schema } from "mongoose";
import { IProduct } from "./product.interface";
export declare const ProductCounter: import("mongoose").Model<{
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
declare const Product: import("mongoose").Model<IProduct, {}, {}, {}, import("mongoose").Document<unknown, {}, IProduct, {}, import("mongoose").DefaultSchemaOptions> & IProduct & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, IProduct>;
export default Product;
//# sourceMappingURL=product.schema.d.ts.map