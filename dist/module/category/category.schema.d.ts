import { ICategoryDocument } from "./category.interface";
declare const Category: import("mongoose").Model<ICategoryDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, ICategoryDocument, {}, import("mongoose").DefaultSchemaOptions> & ICategoryDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICategoryDocument>;
export default Category;
//# sourceMappingURL=category.schema.d.ts.map