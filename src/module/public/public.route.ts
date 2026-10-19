import express from "express";

import * as PublicController from "./public.controller";
import { validate } from "../../middlewares/validate";
import {
  productQuerySchema,
  productSlugParamsSchema,
  productViewQuerySchema,
} from "../product/product.validation";
import { suggestionsSchema } from "./public.validation";
import rateLimit from "express-rate-limit";
import { success } from "zod";
const router = express.Router();

const suggestLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, slow down." },
});
// ── /api/public/products ─────────────────────────────────────────
router.get(
  "/products",
  validate({ query: productQuerySchema }),
  PublicController.getProducts,
);
router.get(
  "/product-filter-categories",
  validate({ query: productQuerySchema }),
  PublicController.getProductFilterCategories,
);
router.get(
  "/search/suggest",
  validate({ query: suggestionsSchema }),
  suggestLimiter,
  PublicController.getSuggestions,
);
router.get("/category/tree", PublicController.getCategoryTree);
router.get("/categories/menu", PublicController.getPublicMergedCategories);
router.get("/category", PublicController.getAllCategories);

router.get(
  "/products/slug/:slug",
  validate({ params: productSlugParamsSchema }),
  PublicController.getProductBySlug,
);
router
  .route("/products/cart/view")
  .get(
    validate({ query: productViewQuerySchema }),
    PublicController.getProductForCart,
  );
export const PublicRoutes = router;
