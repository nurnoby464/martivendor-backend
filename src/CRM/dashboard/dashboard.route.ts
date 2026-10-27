import express from "express";
import * as DashboardController from "./dashboard.controller";

import { saleAnAuthenticateAndUnauthenticated } from "../../middlewares/saleAuthenticateAndUnauthenticate";
import {
  authenticate,
  verifySession,
} from "../../middlewares/AuthenticateHelper";
import { guard } from "../../middlewares/guard";

const router = express.Router();

router.get(
  "/stats",
  authenticate,
  verifySession,
  saleAnAuthenticateAndUnauthenticated,
  guard("super_admin", "sales", "account", "seller"),
  DashboardController.getStats,
);

export const DashboardRouter = router;
