import mongoose, { Document } from "mongoose";
export interface ICompany {
    company_name: string;
    company_email: string;
    phone: string;
    address: string;
    logo: string | null;
    domain: string | null;
    subdomain: string | null;
    status: "active" | "inactive" | "suspended";
    companyNavName: string;
    social_media?: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
        youtube?: string;
        tiktok?: string;
        linkedin?: string;
        whatsapp?: string;
        pinterest?: string;
        website?: string;
    };
    admin_id: mongoose.Types.ObjectId | null;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export interface ICompanyDocument extends ICompany, Document {
}
//# sourceMappingURL=company.interface.d.ts.map