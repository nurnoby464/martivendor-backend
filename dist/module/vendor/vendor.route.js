"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendorRoutes = void 0;
// src/module/vendor/vendor.route.ts
const express_1 = require("express");
const validate_1 = require("../../middlewares/validate");
const vendor_validation_1 = require("./vendor.validation");
const vendor_controller_1 = require("./vendor.controller");
const AuthenticateHelper_1 = require("../../middlewares/AuthenticateHelper");
const guard_1 = require("../../middlewares/guard");
const router = (0, express_1.Router)();
// ── /api/vendors ──────────────────────────────────────────
router
    .route("/")
    .get((0, validate_1.validate)({ query: vendor_validation_1.vendorQuerySchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "admin", "inventory"), vendor_controller_1.VendorController.getVendors)
    .post((0, validate_1.validate)({ body: vendor_validation_1.createVendorSchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "admin", "inventory"), vendor_controller_1.VendorController.createVendor);
// ── /api/vendors/:id ──────────────────────────────────────
router
    .route("/:id")
    .get((0, validate_1.validate)({ params: vendor_validation_1.vendorParamsSchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "admin", "inventory"), vendor_controller_1.VendorController.getVendorById)
    .patch((0, validate_1.validate)({ params: vendor_validation_1.vendorParamsSchema, body: vendor_validation_1.updateVendorSchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "admin", "inventory"), vendor_controller_1.VendorController.updateVendor)
    .delete((0, validate_1.validate)({ params: vendor_validation_1.vendorParamsSchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "admin", "inventory"), vendor_controller_1.VendorController.deleteVendor);
// ── /api/vendors/:id/notes ────────────────────────────────
router
    .route("/:id/notes")
    .post((0, validate_1.validate)({ params: vendor_validation_1.vendorParamsSchema, body: vendor_validation_1.addNoteSchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "admin", "inventory"), vendor_controller_1.VendorController.addNote);
// ── /api/vendors/:id/notes/:noteId ───────────────────────
router
    .route("/:id/notes/:noteId")
    .delete((0, validate_1.validate)({ params: vendor_validation_1.noteParamsSchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "admin", "inventory"), vendor_controller_1.VendorController.deleteNote);
exports.VendorRoutes = router;
//# sourceMappingURL=vendor.route.js.map