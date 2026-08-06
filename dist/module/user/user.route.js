"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersRoute = void 0;
const express_1 = __importDefault(require("express"));
const validate_1 = require("../../middlewares/validate");
const user_validation_1 = require("./user.validation");
const UserController = __importStar(require("./user.controller"));
const AuthenticateHelper_1 = require("../../middlewares/AuthenticateHelper");
const guard_1 = require("../../middlewares/guard");
const seller_validation_1 = require("../seller/seller.validation");
const router = express_1.default.Router();
router.post("/super-admin", (0, validate_1.validate)({ body: user_validation_1.superAdminSchema }), UserController.createSuperAdmin);
router.use(AuthenticateHelper_1.authenticate);
router.use(AuthenticateHelper_1.verifySession);
router.post("/company", (0, guard_1.guard)("super_admin"), (0, validate_1.validate)({ body: seller_validation_1.createNewCompanySchema }), UserController.createCompany);
// ─── POST /users ──────────────────────────────────────────
router.post("/", (0, validate_1.validate)({ body: user_validation_1.createUserSchema }), UserController.create);
// ─── GET /users ───────────────────────────────────────────
router.get("/company/", (0, guard_1.guard)("super_admin"), // only super_admin sees all companies
(0, validate_1.validate)({ query: seller_validation_1.companyQuerySchema }), UserController.getAllCompanies);
router.get("/company/:id", (0, guard_1.guard)("super_admin", "admin"), // super_admin sees any, admin sees own
(0, validate_1.validate)({ params: seller_validation_1.companyParamsSchema }), UserController.getCompanyById);
router.get("/", (0, guard_1.guard)("super_admin", "admin"), UserController.list);
// ─── GET /users/:id ───────────────────────────────────────
router.get("/:id", (0, guard_1.guard)("super_admin", "admin"), UserController.getById);
// ─── DELETE /users/:id ────────────────────────────────────
router.patch("/company/:id/status", (0, guard_1.guard)("super_admin", "admin"), UserController.toggleStatus);
router.patch("/company/:id", (0, guard_1.guard)("super_admin", "admin"), // admin can update own company only
(0, validate_1.validate)({ params: seller_validation_1.companyParamsSchema, body: seller_validation_1.updateCompanySchema }), UserController.updateCompany);
router.delete("/:id", (0, guard_1.guard)("super_admin", "admin"), UserController.remove);
router.delete("/company/:id", (0, guard_1.guard)("super_admin"), // only super_admin can delete
(0, validate_1.validate)({ params: seller_validation_1.companyParamsSchema }), UserController.deleteCompany);
exports.UsersRoute = router;
//# sourceMappingURL=user.route.js.map