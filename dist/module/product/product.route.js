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
exports.ProductRoutes = void 0;
// src/module/product/product.route.ts
const express_1 = require("express");
const validate_1 = require("../../middlewares/validate");
const ProductController = __importStar(require("./product.controller"));
const product_validation_1 = require("./product.validation");
const AuthenticateHelper_1 = require("../../middlewares/AuthenticateHelper");
const guard_1 = require("../../middlewares/guard");
const router = (0, express_1.Router)();
// ── /api/products ─────────────────────────────────────────
router
    .route("/")
    .get((0, validate_1.validate)({ query: product_validation_1.productQuerySchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "seller", "admin", "staff", "seller_staff"), ProductController.getProducts)
    .post((0, validate_1.validate)({ body: product_validation_1.createProductSchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "seller", "admin", "staff", "seller_staff"), ProductController.createProduct);
router.route("/cart/view").get((0, validate_1.validate)({ query: product_validation_1.productViewQuerySchema }), ProductController.getProductView);
router
    .route("/slug/:slug")
    .get((0, validate_1.validate)({ params: product_validation_1.productSlugParamsSchema }), ProductController.getProductBySlug);
// ── /api/products/:id ─────────────────────────────────────
router
    .route("/:id")
    // .get(
    //   validate({ params: productParamsSchema }),
    //   authenticate,
    //   verifySession,
    //   guard("super_admin", "seller", "admin", "staff", "seller_staff"),
    //   ProductController.getProductById,
    // )
    .patch((0, validate_1.validate)({ params: product_validation_1.productParamsSchema, body: product_validation_1.updateProductSchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "seller", "admin", "staff", "seller_staff"), ProductController.updateProduct)
    .delete((0, validate_1.validate)({ params: product_validation_1.productParamsSchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "seller", "admin", "staff", "seller_staff"), ProductController.deleteProduct);
// ── /api/products/:id/variants ────────────────────────────
exports.ProductRoutes = router;
//# sourceMappingURL=product.route.js.map