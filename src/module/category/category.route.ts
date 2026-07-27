// category.route.ts
import { Router } from "express";
import { validate } from "../../middlewares/validate";
import * as CategoryController from "./category.controller";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryParamsSchema,
  categoryQuerySchema,
} from "./category.validation";
import { authenticate, verifySession } from "../../middlewares/AuthenticateHelper";
import { guard } from "../../middlewares/guard";

const router = Router();

// ── /api/categories ───────────────────────────────────────
router
  .route("/")
  .get(
    validate({ query: categoryQuerySchema }),
    authenticate,
    verifySession,
    guard("super_admin", "admin", "inventory","seller","staff"),
    CategoryController.getCategories,
  )
  .post(
    validate({ body: createCategorySchema }),
    authenticate,
    verifySession,
    guard("super_admin", "admin", "inventory","seller","staff"),
    CategoryController.createCategory,
  );

// ── /api/categories/tree ──────────────────────────────────
router
  .route("/tree")
  .get(
    authenticate,
    verifySession,
    guard("super_admin", "admin", "inventory"),
    CategoryController.getCategoryTree,
  );

// ── /api/categories/:id/tree ──────────────────────────────
router
  .route("/:id/tree")
  .get(
    validate({ params: categoryParamsSchema }),
    authenticate,
    verifySession,
    guard("super_admin", "admin", "inventory"),
    CategoryController.getCategoryTree,
  );

// ── /api/categories/:id ───────────────────────────────────
router
  .route("/:id")
  .get(
    validate({ params: categoryParamsSchema }),
    authenticate,
    verifySession,
    guard("super_admin", "admin", "inventory"),
    CategoryController.getCategoryById,
  )
  .patch(
    validate({ params: categoryParamsSchema, body: updateCategorySchema }),
    authenticate,
    verifySession,
    guard("super_admin", "admin", "inventory"),
    CategoryController.updateCategory,
  )
  .delete(
    validate({ params: categoryParamsSchema }),
    authenticate,
    verifySession,
    guard("super_admin", "admin", "inventory"),
    CategoryController.deleteCategory,
  );

export const CategoryRoutes = router;