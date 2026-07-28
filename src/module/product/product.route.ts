// src/module/product/product.route.ts
import { Router } from "express";
import { validate } from "../../middlewares/validate";
import * as ProductController from "./product.controller";
import {
  createProductSchema,
  productParamsSchema,
  productQuerySchema,
  updateProductSchema,
} from "./product.validation";
import {
  authenticate,
  verifySession,
} from "../../middlewares/AuthenticateHelper";
import { guard } from "../../middlewares/guard";

const router = Router();

// ── /api/products ─────────────────────────────────────────
(router
  .route("/")
  .get(
    validate({ query: productQuerySchema }),
    authenticate,
    verifySession,
    guard("super_admin", "seller", "admin", "staff", "seller_staff"),
    ProductController.getProducts,
  )
  .post(validate({ body: createProductSchema }),
  authenticate,
  verifySession,
  guard("super_admin", "seller", "admin", "staff", "seller_staff"),ProductController.createProduct));

// ── /api/products/:id ─────────────────────────────────────
router
  .route("/:id")
  .get(
    validate({ params: productParamsSchema }),
    authenticate,
    verifySession,
    guard("super_admin", "admin", "inventory"),
    ProductController.getProductById,
  )
  .patch(
    validate({ params: productParamsSchema, body: updateProductSchema }),
    authenticate,
    verifySession,
    guard("super_admin", "admin", "inventory"),
    ProductController.updateProduct,
  )
  .delete(
    validate({ params: productParamsSchema }),
    authenticate,
    verifySession,
    guard("super_admin", "admin", "inventory"),
    ProductController.deleteProduct,
  );

// ── /api/products/:id/variants ────────────────────────────

export const ProductRoutes = router;
