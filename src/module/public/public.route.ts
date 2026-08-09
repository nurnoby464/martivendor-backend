import express from "express";

import * as PublicController from "./public.controller";
import { companyIdentifier } from "../../middlewares/companyIdentifier";
import { validate } from "../../middlewares/validate";
import { productQuerySchema } from "../product/product.validation";
import { suggestionsSchema } from "./public.validation";
const router = express.Router();
// ── /api/public/products ─────────────────────────────────────────
router.get(
  "/products",
  validate({ query: productQuerySchema }),
  PublicController.getProducts,
);
router.get(
  "/search/suggest",
  validate({ query: suggestionsSchema }),
  PublicController.getSuggestions,
);
router.get("/category/tree", PublicController.getCategoryTree);
router.get("/categories/menu", PublicController.getPublicMergedCategories);
router.get("/category", PublicController.getAllCategories);
export const PublicRoutes = router;
