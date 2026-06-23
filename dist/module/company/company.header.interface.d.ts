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
    companyId: Types.ObjectId;
    navItems: INavItem[];
}
//# sourceMappingURL=company.header.interface.d.ts.map