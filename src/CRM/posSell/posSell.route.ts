import express from "express";
import * as SaleController from "./posSell.controller";
import { validate } from "../../middlewares/validate";
import { createSaleSchema } from "./posSell.validation";
import { saleAnAuthenticateAndUnauthenticated } from "../../middlewares/saleAuthenticateAndUnauthenticate";
import {
  authenticate,
  verifySession,
} from "../../middlewares/AuthenticateHelper";
import { guard } from "../../middlewares/guard";

const router = express.Router();

router.post(
  "/",
  validate({ body: createSaleSchema }),
  authenticate,
  verifySession,
  saleAnAuthenticateAndUnauthenticated,
  guard("super_admin", "admin", "sales", "account"),
  SaleController.createSale,
);

export const SaleRouter = router;
