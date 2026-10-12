import { Schema } from "mongoose";
export declare const Counter: import("mongoose").Model<{
    key: string;
    seq: number;
}, {}, {}, {
    id: string;
}, import("mongoose").Document<unknown, {}, {
    key: string;
    seq: number;
}, {
    id: string;
}, {
    collection: string;
}> & Omit<{
    key: string;
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
    key: string;
    seq: number;
}, import("mongoose").Document<unknown, {}, {
    key: string;
    seq: number;
}, {
    id: string;
}, Omit<import("mongoose").DefaultSchemaOptions, "collection"> & {
    collection: string;
}> & Omit<{
    key: string;
    seq: number;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, unknown, {
    key: string;
    seq: number;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>, {
    key: string;
    seq: number;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare const nextSequence: (key: string) => Promise<number>;
//# sourceMappingURL=counter.d.ts.map