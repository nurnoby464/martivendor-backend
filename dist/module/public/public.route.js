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
exports.PublicRoutes = void 0;
const express_1 = __importDefault(require("express"));
const PublicController = __importStar(require("./public.controller"));
const validate_1 = require("../../middlewares/validate");
const product_validation_1 = require("../product/product.validation");
const public_validation_1 = require("./public.validation");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = express_1.default.Router();
const suggestLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, slow down." },
});
// ── /api/public/products ─────────────────────────────────────────
router.get("/products", (0, validate_1.validate)({ query: product_validation_1.productQuerySchema }), PublicController.getProducts);
router.get("/product-filter-categories", (0, validate_1.validate)({ query: product_validation_1.productQuerySchema }), PublicController.getProductFilterCategories);
router.get("/search/suggest", (0, validate_1.validate)({ query: public_validation_1.suggestionsSchema }), suggestLimiter, PublicController.getSuggestions);
router.get("/category/tree", PublicController.getCategoryTree);
router.get("/categories/menu", PublicController.getPublicMergedCategories);
router.get("/category", PublicController.getAllCategories);
router.get("/products/slug/:slug", (0, validate_1.validate)({ params: product_validation_1.productSlugParamsSchema }), PublicController.getProductBySlug);
router
    .route("/products/cart/view")
    .get((0, validate_1.validate)({ query: product_validation_1.productViewQuerySchema }), PublicController.getProductForCart);
exports.PublicRoutes = router;
//# sourceMappingURL=public.route.js.map