"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendorController = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const audit_interface_1 = require("../audit/audit.interface");
const vendor_service_1 = require("./vendor.service");
const auditLogger_1 = require("../../utils/auditLogger");
// ─── Create ───────────────────────────────────────────────
const createVendor = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const vendor = await vendor_service_1.VendorService.createVendor({
        ...req.body,
        sellerId: req.user.sellerId,
        createdBy: req.user._id,
    }, req);
    return ApiResponse_1.ApiResponse.created(res, vendor, "Vendor created successfully");
});
// ─── Get all ──────────────────────────────────────────────
const getVendors = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const query = req.validatedQuery;
    const { vendors, total } = await vendor_service_1.VendorService.getVendors({
        sellerId: req.user.sellerId,
        ...query,
    });
    return ApiResponse_1.ApiResponse.paginated(res, "Vendors fetched successfully", vendors, total, query.page, query.limit);
});
// ─── Get one ──────────────────────────────────────────────
const getVendorById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const vendor = await vendor_service_1.VendorService.getVendorById({
        id: req.params.id,
        sellerId: req.user.sellerId,
    });
    return ApiResponse_1.ApiResponse.success(res, vendor);
});
// ─── Update ───────────────────────────────────────────────
const updateVendor = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const before = await vendor_service_1.VendorService.getVendorById({
        id: req.params.id,
        sellerId: req.user.sellerId,
    });
    const vendor = await vendor_service_1.VendorService.updateVendor({
        id: req.params.id,
        sellerId: req.user.sellerId,
        data: req.body,
        req,
    });
    return ApiResponse_1.ApiResponse.success(res, vendor, "Vendor updated successfully");
});
// ─── Delete (soft) ────────────────────────────────────────
const deleteVendor = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const vendor = await vendor_service_1.VendorService.deleteVendor({
        id: req.params.id,
        sellerId: req.user.sellerId,
        req,
    });
    return ApiResponse_1.ApiResponse.success(res, null, "Vendor deactivated successfully");
});
// ─── Add note ─────────────────────────────────────────────
const addNote = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const note = await vendor_service_1.VendorService.addVendorNote({
        id: req.params.id,
        sellerId: req.user.sellerId,
        text: req.body.text,
        createdBy: req.user._id,
    });
    (0, auditLogger_1.auditLog)({
        req,
        action: audit_interface_1.AUDIT_ACTIONS.VENDOR_NOTE_ADDED,
        targetModel: "Vendor",
        after: { vendorId: req.params.id, note },
    });
    return ApiResponse_1.ApiResponse.created(res, note, "Note added successfully");
});
// ─── Delete note ──────────────────────────────────────────
const deleteNote = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await vendor_service_1.VendorService.deleteVendorNote({
        id: req.params.id,
        noteId: req.params.noteId,
        sellerId: req.user.sellerId,
    });
    (0, auditLogger_1.auditLog)({
        req,
        action: audit_interface_1.AUDIT_ACTIONS.VENDOR_NOTE_DELETED,
        targetModel: "Vendor",
        after: { vendorId: req.params.id, noteId: req.params.noteId },
    });
    return ApiResponse_1.ApiResponse.success(res, null, "Note deleted successfully");
});
exports.VendorController = {
    createVendor,
    getVendors,
    getVendorById,
    updateVendor,
    deleteVendor,
    addNote,
    deleteNote,
};
//# sourceMappingURL=vendor.controller.js.map