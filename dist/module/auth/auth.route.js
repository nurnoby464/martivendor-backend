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
exports.AuthRoutes = void 0;
const express_1 = __importDefault(require("express"));
const AuthController = __importStar(require("./auth.controller"));
const validate_1 = require("../../middlewares/validate");
const auth_schema_1 = require("./auth.schema");
const AuthenticateHelper_1 = require("../../middlewares/AuthenticateHelper");
const user_validation_1 = require("../user/user.validation");
const companyIdentifier_1 = require("../../middlewares/companyIdentifier");
const auth_validation_1 = require("./auth.validation");
const router = express_1.default.Router();
// public
router.post("/login", (0, validate_1.validate)({ body: auth_schema_1.loginSchema }), AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post("/register", (0, validate_1.validate)({ body: user_validation_1.registerCustomerSchema }), companyIdentifier_1.companyIdentifier, AuthController.registerCustomer);
router.post("/be-seller", (0, validate_1.validate)({ body: user_validation_1.registerSellerSchema }), AuthController.registerSeller);
router.post("/be-seller-otp", (0, validate_1.validate)({ body: auth_validation_1.validateOTPSchema }), AuthController.verifySellerOPT);
router.post("/resend-otp", (0, validate_1.validate)({ body: auth_validation_1.resendOTPSchema }), AuthController.resendOPT);
router.delete("/session/:userId/:sessionId", (0, validate_1.validate)({ params: auth_schema_1.sessionParamsSchema }), AuthController.removeSession);
// protected
router.post("/logout", AuthController.logout);
router.use(AuthenticateHelper_1.authenticate);
router.use(AuthenticateHelper_1.verifySession);
router.patch("/update-password", (0, validate_1.validate)({ body: auth_schema_1.updatePasswordSchema }), AuthController.updatePassword);
router.put("/update-profile", (0, validate_1.validate)({ body: auth_validation_1.UpdateProfileSchema }), AuthController.updateProfile);
router.get("/me", AuthController.getMe);
exports.AuthRoutes = router;
//# sourceMappingURL=auth.route.js.map