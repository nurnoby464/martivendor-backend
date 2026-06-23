"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyRouter = void 0;
const express_1 = __importDefault(require("express"));
const validate_1 = require("../../middlewares/validate");
const company_validation_1 = require("./company.validation");
const guard_1 = require("../../middlewares/guard");
const AuthenticateHelper_1 = require("../../middlewares/AuthenticateHelper");
const company_controller_1 = require("./company.controller");
const companyIdentifier_1 = require("../../middlewares/companyIdentifier");
const company_header_validation_1 = require("./company.header.validation");
const router = express_1.default.Router();
router.get("/my-company", companyIdentifier_1.companyIdentifier, company_controller_1.CompanyControllers.getMyCompany);
router.get("/nav-items", companyIdentifier_1.companyIdentifier, company_controller_1.CompanyControllers.getHeaderNav);
router.use(AuthenticateHelper_1.authenticate);
router.use(AuthenticateHelper_1.verifySession);
router.post("/users", (0, validate_1.validate)({ body: company_validation_1.createCompanyUserSchema }), (0, guard_1.guard)("admin", "super_admin"), company_controller_1.CompanyControllers.createCompanyUser);
router.get("/users", (0, guard_1.guard)("super_admin", "admin"), (0, validate_1.validate)({ query: company_validation_1.userQuerySchema }), company_controller_1.CompanyControllers.getAllUsers);
router.get("/users/:id", (0, guard_1.guard)("super_admin", "admin"), (0, validate_1.validate)({ params: company_validation_1.userParamsSchema }), company_controller_1.CompanyControllers.getUserById);
router.patch("/users/:id", (0, guard_1.guard)("super_admin", "admin"), (0, validate_1.validate)({ params: company_validation_1.userParamsSchema, body: company_validation_1.updateUserSchema }), company_controller_1.CompanyControllers.updateUser);
router.patch("/my-company", (0, guard_1.guard)("super_admin", "admin"), (0, validate_1.validate)({ body: company_validation_1.updateCompanySchema }), company_controller_1.CompanyControllers.updateMyCompany);
router.patch("/social-media", (0, guard_1.guard)("super_admin", "admin"), (0, validate_1.validate)({ body: company_validation_1.updateSocialMediaSchema }), company_controller_1.CompanyControllers.updateSocialMedia);
router.patch("/nav-items/:id", (0, guard_1.guard)("super_admin", "admin", "site_management"), (0, validate_1.validate)({ params: company_header_validation_1.UpdateParamsSchema, body: company_header_validation_1.UpdateNavItemSchema }), company_controller_1.CompanyControllers.updateHeaderNav);
router.patch("/nav-items/:id/reorder", (0, guard_1.guard)("super_admin", "admin", "site_management"), (0, validate_1.validate)({ params: company_header_validation_1.UpdateParamsSchema, body: company_header_validation_1.ReorderNavItemsBodySchema }), company_controller_1.CompanyControllers.reOrderHeaderNav);
// ─── Delete ───────────────────────────────────────────────
router.delete("/users/:id", (0, guard_1.guard)("super_admin", "admin"), (0, validate_1.validate)({ params: company_validation_1.userParamsSchema }), company_controller_1.CompanyControllers.deleteUser);
router.delete("/nav/:id/item/:navItemId", (0, guard_1.guard)("super_admin", "admin", "site_management"), (0, validate_1.validate)({ params: company_header_validation_1.DeleteNavItemSchema }), company_controller_1.CompanyControllers.deleteHeaderNav);
// header
router.post("/nav-items", (0, guard_1.guard)("super_admin", "admin", "site_management"), (0, validate_1.validate)({ body: company_header_validation_1.CreateNavItemSchema }), company_controller_1.CompanyControllers.createHeaderNav);
exports.CompanyRouter = router;
//# sourceMappingURL=company.route.js.map