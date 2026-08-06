import mongoose from "mongoose";
import { Request } from "express";
export declare const VendorService: {
    createVendor: (payload: {
        sellerId: mongoose.Types.ObjectId;
        name: string;
        phone: string;
        email?: string | null;
        address?: string | null;
        createdBy: mongoose.Types.ObjectId;
    }, req: Request) => Promise<mongoose.Document<unknown, {}, import("./vendor.interface").IVendorDocument, {}, mongoose.DefaultSchemaOptions> & import("./vendor.interface").IVendorDocument & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    getVendors: (payload: {
        sellerId: mongoose.Types.ObjectId;
        page: number;
        limit: number;
        search?: string;
        is_active?: boolean;
        sort_by: string;
        sort_order: string;
    }) => Promise<{
        vendors: (import("./vendor.interface").IVendorDocument & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
    }>;
    getVendorById: (payload: {
        id: string;
        sellerId: mongoose.Types.ObjectId;
    }) => Promise<import("./vendor.interface").IVendorDocument & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }>;
    updateVendor: (payload: {
        id: string;
        sellerId: mongoose.Types.ObjectId;
        data: {
            name?: string;
            phone?: string;
            email?: string | null;
            address?: string | null;
            is_active?: boolean;
        };
        req: Request;
    }) => Promise<mongoose.Document<unknown, {}, import("./vendor.interface").IVendorDocument, {}, mongoose.DefaultSchemaOptions> & import("./vendor.interface").IVendorDocument & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    deleteVendor: (payload: {
        id: string;
        sellerId: mongoose.Types.ObjectId;
        req: Request;
    }) => Promise<mongoose.Document<unknown, {}, import("./vendor.interface").IVendorDocument, {}, mongoose.DefaultSchemaOptions> & import("./vendor.interface").IVendorDocument & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    addVendorNote: (payload: {
        id: string;
        sellerId: mongoose.Types.ObjectId;
        text: string;
        createdBy: mongoose.Types.ObjectId;
    }) => Promise<import("./vendor.interface").IVendorNote | undefined>;
    deleteVendorNote: (payload: {
        id: string;
        noteId: string;
        sellerId: mongoose.Types.ObjectId;
    }) => Promise<void>;
};
//# sourceMappingURL=vendor.service.d.ts.map