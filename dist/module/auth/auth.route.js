"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("./auth.controller");
const validate_1 = require("../../middlewares/validate");
const auth_schema_1 = require("./auth.schema");
const AuthenticateHelper_1 = require("../../middlewares/AuthenticateHelper");
const user_validation_1 = require("../user/user.validation");
const companyIdentifier_1 = require("../../middlewares/companyIdentifier");
const auth_validation_1 = require("./auth.validation");
const router = express_1.default.Router();
// public
router.post("/login", (0, validate_1.validate)({ body: auth_schema_1.loginSchema }), auth_controller_1.AuthController.login);
router.post("/refresh", auth_controller_1.AuthController.refresh);
router.post("/register", (0, validate_1.validate)({ body: user_validation_1.registerCustomerSchema }), companyIdentifier_1.companyIdentifier, auth_controller_1.AuthController.registerCustomer);
router.delete("/session/:userId/:sessionId", (0, validate_1.validate)({ params: auth_schema_1.sessionParamsSchema }), auth_controller_1.AuthController.removeSession);
// protected
router.post("/logout", auth_controller_1.AuthController.logout);
router.use(AuthenticateHelper_1.authenticate);
router.use(AuthenticateHelper_1.verifySession);
router.patch("/update-password", (0, validate_1.validate)({ body: auth_schema_1.updatePasswordSchema }), auth_controller_1.AuthController.updatePassword);
router.put("/update-profile", (0, validate_1.validate)({ body: auth_validation_1.UpdateProfileSchema }), auth_controller_1.AuthController.updateProfile);
router.get("/me", auth_controller_1.AuthController.getMe);
exports.AuthRoutes = router;
//# sourceMappingURL=auth.route.js.map