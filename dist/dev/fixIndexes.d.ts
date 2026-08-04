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
export declare const getPublicMergedCategories: (payload: {
    page: number;
    limit: number;
}) => Promise<{
    categories: PublicCategoryNode[];
    total: number;
    page: number;
    limit: number;
}>;
export declare const DevRouter: import("express-serve-static-core").Router;
//# sourceMappingURL=fixIndexes.d.ts.map