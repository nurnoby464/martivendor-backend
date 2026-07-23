import { Document, Types } from "mongoose";
export interface INavItem {
    _id: Types.ObjectId;
    label: string;
    keyword?: string;
    sectionTitle?: string;
    order: number;
    isActiveInNav: boolean;
    showOnHomepage: boolean;
}
export interface INavConfig extends Document {
    sellerId: Types.ObjectId;
    navItems: INavItem[];
}
//# sourceMappingURL=seller.header.interface.d.ts.map