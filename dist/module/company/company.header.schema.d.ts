import mongoose from "mongoose";
import { INavConfig } from "./company.header.interface";
export declare const NavConfig: mongoose.Model<INavConfig, {}, {}, {}, mongoose.Document<unknown, {}, INavConfig, {}, mongoose.DefaultSchemaOptions> & INavConfig & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, INavConfig>;
//# sourceMappingURL=company.header.schema.d.ts.map