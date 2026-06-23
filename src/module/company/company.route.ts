import express from "express";
import { validate } from "../../middlewares/validate";
import {
  createCompanyUserSchema,
  updateCompanySchema,
  updateSocialMediaSchema,
  updateUserSchema,
  userParamsSchema,
  userQuerySchema,
} from "./company.validation";
import { guard } from "../../middlewares/guard";
import {
  authenticate,
  verifySession,
} from "../../middlewares/AuthenticateHelper";
import { CompanyControllers } from "./company.controller";
import { companyIdentifier } from "../../middlewares/companyIdentifier";
import { CreateNavItemSchema } from "./company.header.validation";

const router = express.Router();
router.get("/my-company", companyIdentifier, CompanyControllers.getMyCompany);
router.get("/nav-items", companyIdentifier, CompanyControllers.getHeaderNav);
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
  validate({ body: updateCompanySchema }),
  CompanyControllers.updateMyCompany,
);
router.patch(
  "/social-media",
  validate({ body: updateSocialMediaSchema }),
  CompanyControllers.updateSocialMedia,
);

// ─── Delete ───────────────────────────────────────────────
router.delete(
  "/users/:id",
  guard("super_admin", "admin"),
  validate({ params: userParamsSchema }),
  CompanyControllers.deleteUser,
);

// header

router.post(
  "/nav-items",
  guard("super_admin", "admin", "site_management"),
  validate({ body: CreateNavItemSchema }),
  CompanyControllers.createHeaderNav,
);
export const CompanyRouter = router;
