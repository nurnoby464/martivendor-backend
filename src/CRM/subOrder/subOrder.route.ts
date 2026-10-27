import express from "express";
import * as SubOrderController from "./subOrder.controller";
import { validate } from "../../middlewares/validate";
import { orderIdParamSchema, sellerOrderListQuerySchema } from "./subOrder.validation";
import {
  authenticate,
  verifySession,
} from "../../middlewares/AuthenticateHelper";
import { guard } from "../../middlewares/guard";

const router = express.Router();

// GET /api/v1/sub-orders  -> the logged-in seller's orders (orders management page)
router.get(
  "/",
  authenticate,
  verifySession,
  guard("super_admin", "seller", "seller_staff", "staff"),
  validate({ query: sellerOrderListQuerySchema }),
  SubOrderController.getSellerOrders,
);
router.get(
  "/:orderId",
  authenticate,
  verifySession,
  guard("super_admin", "seller", "seller_staff", "staff"),
  validate({ params: orderIdParamSchema }),
  SubOrderController.getSellerOrderById,
);

export const SubOrderRouter = router;