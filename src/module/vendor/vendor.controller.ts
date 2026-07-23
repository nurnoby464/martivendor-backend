// src/module/vendor/vendor.controller.ts
import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { AUDIT_ACTIONS } from "../audit/audit.interface";
import { VendorService } from "./vendor.service";
import { auditLog } from "../../utils/auditLogger";

// ─── Create ───────────────────────────────────────────────
const createVendor = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await VendorService.createVendor(
    {
      ...req.body,
      sellerId: req.user.sellerId!,
      createdBy: req.user._id,
    },
    req,
  );

  return ApiResponse.created(res, vendor, "Vendor created successfully");
});

// ─── Get all ──────────────────────────────────────────────
const getVendors = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as {
    page: number;
    limit: number;
    search?: string;
    is_active?: boolean;
    sort_by: string;
    sort_order: string;
  };
  const { vendors, total } = await VendorService.getVendors({
    sellerId: req.user.sellerId!,
    ...query,
  });

  return ApiResponse.paginated(
    res,
    "Vendors fetched successfully",
    vendors,
    total,
    query.page,
    query.limit,
  );
});

// ─── Get one ──────────────────────────────────────────────
const getVendorById = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await VendorService.getVendorById({
    id: req.params.id as string,
    sellerId: req.user.sellerId!,
  });

  return ApiResponse.success(res, vendor);
});

// ─── Update ───────────────────────────────────────────────
const updateVendor = asyncHandler(async (req: Request, res: Response) => {
  const before = await VendorService.getVendorById({
    id: req.params.id as string,
    sellerId: req.user.sellerId!,
  });

  const vendor = await VendorService.updateVendor({
    id: req.params.id as string,
    sellerId: req.user.sellerId!,
    data: req.body,
    req,
  });

  return ApiResponse.success(res, vendor, "Vendor updated successfully");
});

// ─── Delete (soft) ────────────────────────────────────────
const deleteVendor = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await VendorService.deleteVendor({
    id: req.params.id as string,
    sellerId: req.user.sellerId!,
    req,
  });

  return ApiResponse.success(res, null, "Vendor deactivated successfully");
});

// ─── Add note ─────────────────────────────────────────────
const addNote = asyncHandler(async (req: Request, res: Response) => {
  const note = await VendorService.addVendorNote({
    id: req.params.id as string,
    sellerId: req.user.sellerId!,
    text: req.body.text,
    createdBy: req.user._id,
  });

  auditLog({
    req,
    action: AUDIT_ACTIONS.VENDOR_NOTE_ADDED,
    targetModel: "Vendor",
    after: { vendorId: req.params.id, note },
  });

  return ApiResponse.created(res, note, "Note added successfully");
});

// ─── Delete note ──────────────────────────────────────────
const deleteNote = asyncHandler(async (req: Request, res: Response) => {
  await VendorService.deleteVendorNote({
    id: req.params.id as string,
    noteId: req.params.noteId as string,
    sellerId: req.user.sellerId!,
  });

  auditLog({
    req,
    action: AUDIT_ACTIONS.VENDOR_NOTE_DELETED,
    targetModel: "Vendor",
    after: { vendorId: req.params.id, noteId: req.params.noteId },
  });

  return ApiResponse.success(res, null, "Note deleted successfully");
});

export const VendorController = {
  createVendor,
  getVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
  addNote,
  deleteNote,
};
