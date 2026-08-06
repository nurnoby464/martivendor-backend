"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendorService = void 0;
// src/module/vendor/vendor.service.ts
const mongoose_1 = __importDefault(require("mongoose"));
const vendor_schema_1 = __importDefault(require("./vendor.schema"));
const appError_1 = require("../../middlewares/appError");
const sanitizeData_1 = require("../../utils/sanitizeData");
const auditLogger_1 = require("../../utils/auditLogger");
const audit_interface_1 = require("../audit/audit.interface");
// ─── Create vendor ────────────────────────────────────────
const createVendor = async (payload, req) => {
    const { sellerId, createdBy, ...rest } = payload;
    // check duplicate phone within same company
    const existing = await vendor_schema_1.default.findOne({
        sellerId: payload.sellerId,
        phone: payload.phone,
    });
    if (existing)
        throw new appError_1.AppError("A vendor with this phone already exists", 409);
    const vendor = await vendor_schema_1.default.create((0, sanitizeData_1.sanitizeData)({ ...rest, sellerId, createdBy }));
    (0, auditLogger_1.auditLog)({
        req,
        action: audit_interface_1.AUDIT_ACTIONS.VENDOR_CREATED,
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
const getVendors = async (payload) => {
    const { sellerId, page, limit, search, is_active, sort_by, sort_order } = payload;
    const filter = { sellerId };
    if (is_active !== undefined)
        filter.is_active = is_active;
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
        ];
    }
    const sortField = sort_by === "due" ? "due" : sort_by === "name" ? "name" : "createdAt";
    const sortDir = sort_order === "asc" ? 1 : -1;
    const [vendors, total] = await Promise.all([
        vendor_schema_1.default.find(filter)
            .select("-notes") // exclude notes in list view
            .sort({ [sortField]: sortDir })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        vendor_schema_1.default.countDocuments(filter),
    ]);
    return { vendors, total };
};
// ─── Get single vendor ────────────────────────────────────
const getVendorById = async (payload) => {
    const vendor = await vendor_schema_1.default.findOne({
        _id: payload.id,
        sellerId: payload.sellerId,
    })
        .populate("notes.createdBy", "name email")
        .lean();
    if (!vendor)
        throw new appError_1.AppError("Vendor not found", 404);
    return vendor;
};
// ─── Update vendor ────────────────────────────────────────
const updateVendor = async (payload) => {
    const { id, sellerId, data } = payload;
    const vendor = await vendor_schema_1.default.findOne({ _id: id, sellerId });
    if (!vendor)
        throw new appError_1.AppError("Vendor not found", 404);
    const before = {
        name: vendor.name,
        phone: vendor.phone,
        email: vendor.email,
        address: vendor.address,
        is_active: vendor.is_active,
    };
    // if phone is changing — check duplicate
    if (data.phone && data.phone !== vendor.phone) {
        const duplicate = await vendor_schema_1.default.findOne({
            sellerId,
            phone: data.phone,
            _id: { $ne: id },
        });
        if (duplicate)
            throw new appError_1.AppError("A vendor with this phone already exists", 409);
    }
    const clean = (0, sanitizeData_1.sanitizeData)(data);
    Object.assign(vendor, clean);
    await vendor.save();
    (0, auditLogger_1.auditLog)({
        req: payload.req,
        action: audit_interface_1.AUDIT_ACTIONS.VENDOR_UPDATED,
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
const deleteVendor = async (payload) => {
    const vendor = await vendor_schema_1.default.findOne({
        _id: payload.id,
        sellerId: payload.sellerId,
    });
    if (!vendor)
        throw new appError_1.AppError("Vendor not found", 404);
    const before = {
        name: vendor.name,
        phone: vendor.phone,
        email: vendor.email,
        address: vendor.address,
        is_active: vendor.is_active,
    };
    // prevent delete if vendor has outstanding due
    if (vendor.due > 0) {
        throw new appError_1.AppError(`Cannot delete vendor with outstanding due of ৳${vendor.due}`, 400);
    }
    vendor.is_active = false;
    await vendor.save();
    (0, auditLogger_1.auditLog)({
        req: payload.req,
        action: audit_interface_1.AUDIT_ACTIONS.VENDOR_DELETED,
        targetModel: "Vendor",
        targetId: vendor._id,
        before: before,
        after: null,
    });
    return vendor;
};
// ─── Add note ─────────────────────────────────────────────
const addVendorNote = async (payload) => {
    const { id, sellerId, text, createdBy } = payload;
    const vendor = await vendor_schema_1.default.findOne({ _id: id, sellerId });
    if (!vendor)
        throw new appError_1.AppError("Vendor not found", 404);
    const _id = new mongoose_1.default.Types.ObjectId();
    vendor.notes.push({ _id, text, createdBy, createdAt: new Date() });
    await vendor.save();
    return vendor.notes[vendor.notes.length - 1]; // return the new note
};
// ─── Delete note ──────────────────────────────────────────
const deleteVendorNote = async (payload) => {
    const { id, noteId, sellerId } = payload;
    const vendor = await vendor_schema_1.default.findOne({ _id: id, sellerId });
    if (!vendor)
        throw new appError_1.AppError("Vendor not found", 404);
    const noteExists = vendor.notes.some((n) => n._id?.toString() === noteId);
    if (!noteExists)
        throw new appError_1.AppError("Note not found", 404);
    await vendor_schema_1.default.updateOne({ _id: id }, { $pull: { notes: { _id: new mongoose_1.default.Types.ObjectId(noteId) } } });
};
exports.VendorService = {
    createVendor,
    getVendors,
    getVendorById,
    updateVendor,
    deleteVendor,
    addVendorNote,
    deleteVendorNote,
};
//# sourceMappingURL=vendor.service.js.map