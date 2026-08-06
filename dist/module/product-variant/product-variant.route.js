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
exports.ProductVariantRoute = void 0;
const express_1 = require("express");
const validate_1 = require("../../middlewares/validate");
const AuthenticateHelper_1 = require("../../middlewares/AuthenticateHelper");
const guard_1 = require("../../middlewares/guard");
const ProductVariantController = __importStar(require("./product-variant.controller"));
const product_variant_validation_1 = require("./product-variant.validation");
const variantRouter = (0, express_1.Router)({ mergeParams: true }); // mergeParams to access :id from parent
variantRouter
    .route("/all-products")
    .get((0, validate_1.validate)({ query: product_variant_validation_1.productVariantQuerySchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, ProductVariantController.getAllProductWithVariant);
variantRouter
    .route("/")
    .get((0, validate_1.validate)({ params: product_variant_validation_1.variantParamsSchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "admin", "inventory", "sales", "report"), ProductVariantController.getVariants)
    .post((0, validate_1.validate)({ params: product_variant_validation_1.variantParamsSchema, body: product_variant_validation_1.createVariantSchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "admin", "inventory"), ProductVariantController.createVariant);
variantRouter
    .route("/edit")
    .patch(AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "admin", "inventory"), (0, validate_1.validate)({ body: product_variant_validation_1.editProductVariantSchema }), ProductVariantController.editProductVariant);
variantRouter
    .route("/:variantId")
    .get((0, validate_1.validate)({ params: product_variant_validation_1.productVariantParamsSchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "admin", "inventory", "sales", "report"), ProductVariantController.getVariantById)
    .patch((0, validate_1.validate)({ params: product_variant_validation_1.productVariantParamsSchema, body: product_variant_validation_1.updateVariantSchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "admin", "inventory"), ProductVariantController.updateVariant)
    .delete((0, validate_1.validate)({ params: product_variant_validation_1.productVariantParamsSchema }), AuthenticateHelper_1.authenticate, AuthenticateHelper_1.verifySession, (0, guard_1.guard)("super_admin", "admin"), ProductVariantController.deleteVariant);
exports.ProductVariantRoute = variantRouter;
//# sourceMappingURL=product-variant.route.js.map