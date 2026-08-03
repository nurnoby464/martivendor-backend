import express from "express";

import * as PublicController from "./public.controller";
import { companyIdentifier } from "../../middlewares/companyIdentifier";
import { validate } from "../../middlewares/validate";
import { productQuerySchema } from "../product/product.validation";
const router = express.Router();
// ── /api/public/products ─────────────────────────────────────────
router.get(
  "/products",
  validate({ query: productQuerySchema }),
  PublicController.getProducts,
);
router.get("/category/tree", PublicController.getCategoryTree);
router.get("/categories/menu", PublicController.getCategoriesMenu);
router.get("/category",  PublicController.getAllCategories);
router.get("/product/:id", companyIdentifier, PublicController.getProductById);
router.get("/db-test", PublicController.dbTest);
export const PublicRoutes= router ;
