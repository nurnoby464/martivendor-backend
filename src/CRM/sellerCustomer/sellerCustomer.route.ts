import express from "express";
import * as SellerCustomerController from "./sellerCustomer.controller";
import { validate } from "../../middlewares/validate";
import {
  authenticate,
  verifySession,
} from "../../middlewares/AuthenticateHelper";
import { saleAnAuthenticateAndUnauthenticated } from "../../middlewares/saleAuthenticateAndUnauthenticate";
import { guard } from "../../middlewares/guard";
import { customerQuerySchema, updateStatusSchema, updateTagsSchema } from "./sellerCustomer.validation";

const router = express.Router();

router.get(
  "/my",
  authenticate,
  saleAnAuthenticateAndUnauthenticated,
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
  validate({ query: customerQuerySchema }),
  SellerCustomerController.getMyCustomers,
);
router.patch(
  "/my/:id/tags",
  authenticate,
  saleAnAuthenticateAndUnauthenticated,
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
  validate({ body: updateTagsSchema }),
  SellerCustomerController.updateTags,
);
router.patch(
  "/my/:id/status",
  authenticate,
  saleAnAuthenticateAndUnauthenticated,
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
  validate({ body: updateStatusSchema }),
  SellerCustomerController.updateStatus,
);

export const SellerCustomerRouter = router;
