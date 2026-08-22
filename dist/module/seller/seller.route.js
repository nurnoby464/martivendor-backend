"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyRouter = void 0;
const express_1 = __importDefault(require("express"));
const validate_1 = require("../../middlewares/validate");
const seller_validation_1 = require("./seller.validation");
const guard_1 = require("../../middlewares/guard");
const AuthenticateHelper_1 = require("../../middlewares/AuthenticateHelper");
const seller_controller_1 = require("./seller.controller");
const seller_header_validation_1 = require("./seller.header.validation");
const router = express_1.default.Router();
router.get("/my-company", seller_controller_1.CompanyControllers.getMyCompany);
router.get("/nav-items", seller_controller_1.CompanyControllers.getHeaderNav);
router.use(AuthenticateHelper_1.authenticate);
router.use(AuthenticateHelper_1.verifySession);
router.post("/users", (0, validate_1.validate)({ body: seller_validation_1.createCompanyUserSchema }), (0, guard_1.guard)("admin", "super_admin"), seller_controller_1.CompanyControllers.createCompanyUser);
router.get("/users", (0, guard_1.guard)("super_admin", "admin"), (0, validate_1.validate)({ query: seller_validation_1.userQuerySchema }), seller_controller_1.CompanyControllers.getAllUsers);
router.get("/users/:id", (0, guard_1.guard)("super_admin", "admin"), (0, validate_1.validate)({ params: seller_validation_1.userParamsSchema }), seller_controller_1.CompanyControllers.getUserById);
router.patch("/users/:id", (0, guard_1.guard)("super_admin", "admin"), (0, validate_1.validate)({ params: seller_validation_1.userParamsSchema, body: seller_validation_1.updateUserSchema }), seller_controller_1.CompanyControllers.updateUser);
router.patch("/my-company", (0, guard_1.guard)("super_admin", "admin"), (0, validate_1.validate)({ body: seller_validation_1.updateCompanySchema }), seller_controller_1.CompanyControllers.updateMyCompany);
router.patch("/social-media", (0, guard_1.guard)("super_admin", "admin"), (0, validate_1.validate)({ body: seller_validation_1.updateSocialMediaSchema }), seller_controller_1.CompanyControllers.updateSocialMedia);
router.patch("/nav-items/:id", (0, guard_1.guard)("super_admin", "admin", "site_management"), (0, validate_1.validate)({ params: seller_header_validation_1.UpdateParamsSchema, body: seller_header_validation_1.UpdateNavItemSchema }), seller_controller_1.CompanyControllers.updateHeaderNav);
router.patch("/nav-items/:id/reorder", (0, guard_1.guard)("super_admin", "admin", "site_management"), (0, validate_1.validate)({ params: seller_header_validation_1.UpdateParamsSchema, body: seller_header_validation_1.ReorderNavItemsBodySchema }), seller_controller_1.CompanyControllers.reOrderHeaderNav);
// ─── Delete ───────────────────────────────────────────────
router.delete("/users/:id", (0, guard_1.guard)("super_admin", "admin"), (0, validate_1.validate)({ params: seller_validation_1.userParamsSchema }), seller_controller_1.CompanyControllers.deleteUser);
router.delete("/nav/:id/item/:navItemId", (0, guard_1.guard)("super_admin", "admin", "site_management"), (0, validate_1.validate)({ params: seller_header_validation_1.DeleteNavItemSchema }), seller_controller_1.CompanyControllers.deleteHeaderNav);
// header
router.post("/nav-items", (0, guard_1.guard)("super_admin", "admin", "site_management"), (0, validate_1.validate)({ body: seller_header_validation_1.CreateNavItemSchema }), seller_controller_1.CompanyControllers.createHeaderNav);
exports.CompanyRouter = router;
//# sourceMappingURL=seller.route.js.map