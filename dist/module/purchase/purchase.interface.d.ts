import mongoose, { Document } from "mongoose";
export interface IPurchaseItem {
    product_id: mongoose.Types.ObjectId;
    variant_id: mongoose.Types.ObjectId;
    product_name: string;
    sku: string;
    color: string | null;
    size: string | null;
    quantity: number;
    unit_price: number;
    selling_price: number;
    total: number;
}
export interface IPurchase {
    sellerId: mongoose.Types.ObjectId;
    vendor_id: mongoose.Types.ObjectId;
    items: IPurchaseItem[];
    product_ids: mongoose.Types.ObjectId[];
    item_count: number;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    status: "pending" | "partial" | "paid";
    purchase_date: Date;
    note: string | null;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export interface IPurchaseDocument extends IPurchase, Document {
}
//# sourceMappingURL=purchase.interface.d.ts.map