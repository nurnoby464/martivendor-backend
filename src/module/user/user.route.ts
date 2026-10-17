import express from "express";
import { validate } from "../../middlewares/validate";
import {
  createUserSchema,
  superAdminSchema,
  userDetailsQuerySchema,
  userStatsQuerySchema,
} from "./user.validation";
import * as UserController from "./user.controller";
import {
  authenticate,
  optionalAuthForUser,
  verifySession,
} from "../../middlewares/AuthenticateHelper";
import { guard } from "../../middlewares/guard";
import {
  companyParamsSchema,
  companyQuerySchema,
  createNewCompanySchema,
  updateCompanySchema,
} from "../seller/seller.validation";

const router = express.Router();
router.post(
  "/super-admin",
  validate({ body: superAdminSchema }),
  UserController.createSuperAdmin,
);
router.post(
  "/",
  validate({ body: createUserSchema }),
  UserController.createUser,
);

router.use(authenticate);
router.use(verifySession);
router.post(
  "/company",
  guard("super_admin"),
  validate({ body: createNewCompanySchema }),
  UserController.createCompany,
);
// ─── POST /users ──────────────────────────────────────────

// ─── GET /users ───────────────────────────────────────────
router.get(
  "/company/",
  guard("super_admin"), // only super_admin sees all companies
  validate({ query: companyQuerySchema }),
  UserController.getAllCompanies,
);
router.get(
  "/stats/",
  guard("super_admin"), // only super_admin sees all companies
  validate({ query: userStatsQuerySchema }),
  UserController.getUserStats,
);
router.get(
  "/details/",
  guard("super_admin"), // only super_admin sees all companies
  validate({ query: userDetailsQuerySchema }),
  UserController.getUserDetails,
);

router.get(
  "/company/:id",
  guard("super_admin", "admin"), // super_admin sees any, admin sees own
  validate({ params: companyParamsSchema }),
  UserController.getCompanyById,
);
router.get("/", guard("super_admin", "admin"), UserController.list);

// ─── GET /users/:id ───────────────────────────────────────
router.get("/:id", guard("super_admin", "admin"), UserController.getById);

// ─── DELETE /users/:id ────────────────────────────────────

router.patch(
  "/company/:id/status",
  guard("super_admin", "admin"),
  UserController.toggleStatus,
);

router.patch(
  "/company/:id",
  guard("super_admin", "admin"), // admin can update own company only
  validate({ params: companyParamsSchema, body: updateCompanySchema }),
  UserController.updateCompany,
);
router.delete("/:id", guard("super_admin", "admin"), UserController.remove);

router.delete(
  "/company/:id",
  guard("super_admin"), // only super_admin can delete
  validate({ params: companyParamsSchema }),
  UserController.deleteCompany,
);

export const UsersRoute = router;
