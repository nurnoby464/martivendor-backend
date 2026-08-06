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
exports.SaleRouter = void 0;
const express_1 = __importDefault(require("express"));
const SaleController = __importStar(require("./sales.controller"));
const validate_1 = require("../../middlewares/validate");
const sales_validation_1 = require("./sales.validation");
const saleAuthenticateAndUnauthenticate_1 = require("../../middlewares/saleAuthenticateAndUnauthenticate");
const AuthenticateHelper_1 = require("../../middlewares/AuthenticateHelper");
const guard_1 = require("../../middlewares/guard");
const router = express_1.default.Router();
router.post("/", (0, validate_1.validate)({ body: sales_validation_1.createSaleSchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, saleAuthenticateAndUnauthenticate_1.saleAnAuthenticateAndUnauthenticated, (0, guard_1.guard)("super_admin", "admin", "sales", "account"), SaleController.createSale);
exports.SaleRouter = router;
//# sourceMappingURL=sales.route.js.map