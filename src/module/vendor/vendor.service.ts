// src/module/vendor/vendor.service.ts
import mongoose from "mongoose";
import Vendor from "./vendor.schema";
import { AppError } from "../../middlewares/appError";
import { sanitizeData } from "../../utils/sanitizeData";
import { auditLog } from "../../utils/auditLogger";
import { AUDIT_ACTIONS } from "../audit/audit.interface";
import { Request } from "express";

// ─── Create vendor ────────────────────────────────────────
const createVendor = async (
  payload: {
    sellerId: mongoose.Types.ObjectId;
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
    createdBy: mongoose.Types.ObjectId;
  },
  req: Request,
) => {
  const { sellerId, createdBy, ...rest } = payload;
  // check duplicate phone within same company
  const existing = await Vendor.findOne({
    sellerId: payload.sellerId,
    phone: payload.phone,
  });
  if (existing)
    throw new AppError("A vendor with this phone already exists", 409);

  const vendor = await Vendor.create(
    sanitizeData({ ...rest, sellerId, createdBy }),
  );
  auditLog({
    req,
    action: AUDIT_ACTIONS.VENDOR_CREATED,
    targetModel: "Vendor",
    targetId: vendor._id,
    after: {
      name: vendor.name,
      phone: vendor.phone,
      email: vendor.email,
      address: vendor.address,
    },
  });
  return vendor;
};

// ─── Get all vendors (paginated) ──────────────────────────
const getVendors = async (payload: {
  sellerId: mongoose.Types.ObjectId;
  page: number;
  limit: number;
  search?: string;
  is_active?: boolean;
  sort_by: string;
  sort_order: string;
}) => {
  const { sellerId, page, limit, search, is_active, sort_by, sort_order } =
    payload;

  const filter: Record<string, unknown> = { sellerId };

  if (is_active !== undefined) filter.is_active = is_active;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const sortField =
    sort_by === "due" ? "due" : sort_by === "name" ? "name" : "createdAt";
  const sortDir = sort_order === "asc" ? 1 : -1;

  const [vendors, total] = await Promise.all([
    Vendor.find(filter)
      .select("-notes") // exclude notes in list view
      .sort({ [sortField]: sortDir })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Vendor.countDocuments(filter),
  ]);

  return { vendors, total };
};

// ─── Get single vendor ────────────────────────────────────
const getVendorById = async (payload: {
  id: string;
  sellerId: mongoose.Types.ObjectId;
}) => {
  const vendor = await Vendor.findOne({
    _id: payload.id,
    sellerId: payload.sellerId,
  })
    .populate("notes.createdBy", "name email")
    .lean();

  if (!vendor) throw new AppError("Vendor not found", 404);
  return vendor;
};

// ─── Update vendor ────────────────────────────────────────
const updateVendor = async (payload: {
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
}) => {
  const { id, sellerId, data } = payload;

  const vendor = await Vendor.findOne({ _id: id, sellerId });
  if (!vendor) throw new AppError("Vendor not found", 404);
  const before: Record<string, unknown> = {
    name: vendor.name,
    phone: vendor.phone,
    email: vendor.email,
    address: vendor.address,
    is_active: vendor.is_active,
  };

  // if phone is changing — check duplicate
  if (data.phone && data.phone !== vendor.phone) {
    const duplicate = await Vendor.findOne({
      sellerId,
      phone: data.phone,
      _id: { $ne: id },
    });
    if (duplicate)
      throw new AppError("A vendor with this phone already exists", 409);
  }

  const clean = sanitizeData(data as Record<string, unknown>);
  Object.assign(vendor, clean);
  await vendor.save();

  auditLog({
    req: payload.req,
    action: AUDIT_ACTIONS.VENDOR_UPDATED,
    targetModel: "Vendor",
    targetId: vendor._id,
    before: before,
    after: {
      name: vendor.name,
      phone: vendor.phone,
      email: vendor.email,
      address: vendor.address,
      is_active: vendor.is_active,
    },
  });

  return vendor;
};

// ─── Delete vendor (soft delete) ─────────────────────────
const deleteVendor = async (payload: {
  id: string;
  sellerId: mongoose.Types.ObjectId;
  req: Request;
}) => {
  const vendor = await Vendor.findOne({
    _id: payload.id,
    sellerId: payload.sellerId,
  });
  if (!vendor) throw new AppError("Vendor not found", 404);

  const before: Record<string, unknown> = {
    name: vendor.name,
    phone: vendor.phone,
    email: vendor.email,
    address: vendor.address,
    is_active: vendor.is_active,
  };

  // prevent delete if vendor has outstanding due
  if (vendor.due > 0) {
    throw new AppError(
      `Cannot delete vendor with outstanding due of ৳${vendor.due}`,
      400,
    );
  }

  vendor.is_active = false;
  await vendor.save();

  auditLog({
    req: payload.req,
    action: AUDIT_ACTIONS.VENDOR_DELETED,
    targetModel: "Vendor",
    targetId: vendor._id,
    before: before,
    after: null,
  });

  return vendor;
};

// ─── Add note ─────────────────────────────────────────────
const addVendorNote = async (payload: {
  id: string;
  sellerId: mongoose.Types.ObjectId;
  text: string;
  createdBy: mongoose.Types.ObjectId;
}) => {
  const { id, sellerId, text, createdBy } = payload;

  const vendor = await Vendor.findOne({ _id: id, sellerId });
  if (!vendor) throw new AppError("Vendor not found", 404);
  const _id = new mongoose.Types.ObjectId();
  vendor.notes.push({ _id, text, createdBy, createdAt: new Date() });
  await vendor.save();

  return vendor.notes[vendor.notes.length - 1]; // return the new note
};

// ─── Delete note ──────────────────────────────────────────
const deleteVendorNote = async (payload: {
  id: string;
  noteId: string;
  sellerId: mongoose.Types.ObjectId;
}) => {
  const { id, noteId, sellerId } = payload;

  const vendor = await Vendor.findOne({ _id: id, sellerId });
  if (!vendor) throw new AppError("Vendor not found", 404);

  const noteExists = vendor.notes.some((n) => n._id?.toString() === noteId);
  if (!noteExists) throw new AppError("Note not found", 404);

  await Vendor.updateOne(
    { _id: id },
    { $pull: { notes: { _id: new mongoose.Types.ObjectId(noteId) } } },
  );
};

export const VendorService = {
  createVendor,
  getVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
  addVendorNote,
  deleteVendorNote,
};
