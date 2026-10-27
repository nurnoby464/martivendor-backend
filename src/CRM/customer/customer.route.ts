import express from "express";
import * as CustomerController from "./customer.controller";
import { validate } from "../../middlewares/validate";
import {
  createCustomerSchema,
  customerQuerySchema,
} from "./customer.validation";
import {
  authenticate,
  verifySession,
} from "../../middlewares/AuthenticateHelper";
import { saleAnAuthenticateAndUnauthenticated } from "../../middlewares/saleAuthenticateAndUnauthenticate";
import { guard } from "../../middlewares/guard";

const router = express.Router();
router.get(
  "/",
  authenticate,
  saleAnAuthenticateAndUnauthenticated,
  verifySession,
  guard(
    "super_admin",
    // "account",
    // "sales",
    // "admin",
    // "seller",
    // "seller_staff",
    // "staff",
  ),
  validate({ query: customerQuerySchema }),
  CustomerController.getCustomerList,
);
router.post(
  "/",
  authenticate,
  verifySession,
  guard(
    "super_admin",
    "account",
    "sales",
    "admin",
    "seller",
    "seller_staff",
    "staff",
  ),
  validate({ body: createCustomerSchema }),
  CustomerController.createCustomer,
);
export const CustomerRouter = router;
