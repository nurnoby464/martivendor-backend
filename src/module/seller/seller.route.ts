import express from "express";
import { validate } from "../../middlewares/validate";
import {
  createCompanyUserSchema,
  updateCompanySchema,
  updateSocialMediaSchema,
  updateUserSchema,
  userParamsSchema,
  userQuerySchema,
} from "./seller.validation";
import { guard } from "../../middlewares/guard";
import {
  authenticate,
  verifySession,
} from "../../middlewares/AuthenticateHelper";
import { CompanyControllers } from "./seller.controller";
import { CreateNavItemSchema, DeleteNavItemSchema, ReorderNavItemsBodySchema, UpdateNavItemSchema, UpdateParamsSchema } from "./seller.header.validation";

const router = express.Router();
router.get("/my-company",  CompanyControllers.getMyCompany);
router.get("/nav-items",  CompanyControllers.getHeaderNav);
router.use(authenticate);
router.use(verifySession);
router.post(
  "/users",
  validate({ body: createCompanyUserSchema }),
  guard("admin", "super_admin"),
  CompanyControllers.createCompanyUser,
);
router.get(
  "/users",
  guard("super_admin", "admin"),
  validate({ query: userQuerySchema }),
  CompanyControllers.getAllUsers,
);
router.get(
  "/users/:id",
  guard("super_admin", "admin"),
  validate({ params: userParamsSchema }),
  CompanyControllers.getUserById,
);

router.patch(
  "/users/:id",
  guard("super_admin", "admin"),
  validate({ params: userParamsSchema, body: updateUserSchema }),
  CompanyControllers.updateUser,
);

router.patch(
  "/my-company",
  guard("super_admin", "admin"),
  validate({ body: updateCompanySchema }),
  CompanyControllers.updateMyCompany,
);
router.patch(
  "/social-media",
  guard("super_admin", "admin"),
  validate({ body: updateSocialMediaSchema }),
  CompanyControllers.updateSocialMedia,
);
router.patch(
  "/nav-items/:id",
  guard("super_admin", "admin","site_management"),
  validate({params:UpdateParamsSchema, body: UpdateNavItemSchema }),
  CompanyControllers.updateHeaderNav,
);

router.patch(
  "/nav-items/:id/reorder",
  guard("super_admin", "admin","site_management"),
  validate({params:UpdateParamsSchema, body: ReorderNavItemsBodySchema }),
  CompanyControllers.reOrderHeaderNav,
);

// ─── Delete ───────────────────────────────────────────────
router.delete(
  "/users/:id",
  guard("super_admin", "admin"),
  validate({ params: userParamsSchema }),
  CompanyControllers.deleteUser,
);
router.delete(
  "/nav/:id/item/:navItemId",
  guard("super_admin", "admin","site_management"),
  validate({ params: DeleteNavItemSchema }),
  CompanyControllers.deleteHeaderNav,
);

// header

router.post(
  "/nav-items",
  guard("super_admin", "admin", "site_management"),
  validate({ body: CreateNavItemSchema }),
  CompanyControllers.createHeaderNav,
);
export const CompanyRouter = router;
