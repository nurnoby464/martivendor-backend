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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseRoute = void 0;
// src/module/purchase/purchase.route.ts
const express_1 = require("express");
const validate_1 = require("../../middlewares/validate");
const PurchaseController = __importStar(require("./purchase.controller"));
const purchase_validation_1 = require("./purchase.validation");
const AuthenticateHelper_1 = require("../../middlewares/AuthenticateHelper");
const guard_1 = require("../../middlewares/guard");
const router = (0, express_1.Router)();
// ── /api/purchases ────────────────────────────────────────
router
    .route("/")
    .get((0, validate_1.validate)({ query: purchase_validation_1.purchaseQuerySchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "admin", "account"), PurchaseController.getPurchases)
    .post((0, validate_1.validate)({ body: purchase_validation_1.createPurchaseSchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "admin", "account"), PurchaseController.createPurchase);
router
    .route("/update-stock")
    .patch(AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "admin", "account"), (0, validate_1.validate)({ body: purchase_validation_1.updateStockPurchaseSchema }), PurchaseController.updateStock);
// ── /api/purchases/:id ────────────────────────────────────
router
    .route("/:id")
    .get((0, validate_1.validate)({ params: purchase_validation_1.purchaseParamsSchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "admin", "account"), PurchaseController.getPurchaseById)
    .patch((0, validate_1.validate)({ params: purchase_validation_1.purchaseParamsSchema, body: purchase_validation_1.updatePurchaseSchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "admin", "account"), PurchaseController.updatePayment)
    .delete((0, validate_1.validate)({ params: purchase_validation_1.purchaseParamsSchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "admin"), PurchaseController.remove);
exports.PurchaseRoute = router;
//# sourceMappingURL=purchase.route.js.map