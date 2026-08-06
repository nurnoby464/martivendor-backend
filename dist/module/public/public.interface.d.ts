import mongoose from "mongoose";
export interface PublicCategoryNode {
    slugPath: string[];
    slug: string;
    name: string;
    depth: number;
    parentSlugPath: string[] | null;
    image: string | null;
    sellerCount: number;
    hasChildren: boolean;
}
export interface ProductsByCategorySlugQuery {
    slug: string;
    page: number;
    limit: number;
    sorBy?: string;
    sortOrder?: string;
    search?: string;
    hasVariants?: boolean;
    isActive?: boolean;
    lowStock?: boolean;
    productType?: string;
    tags?: string[];
    discount?: number;
    hasDiscount?: boolean;
}
export type AncestorItem = {
    _id: mongoose.Types.ObjectId;
    name: string;
    depth: number;
};
export type CategorySearchItem = {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    fullPath: string;
    parentId: mongoose.Types.ObjectId | null;
    parentName: string | null;
    ancestors: AncestorItem[];
    depth: number;
    hasChildren: boolean;
    image: string | null;
};
//# sourceMappingURL=public.interface.d.ts.map