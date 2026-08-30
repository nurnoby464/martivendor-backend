import express from "express";
import * as OrderController from "./order.controller";
import { validate } from "../../middlewares/validate";
import {
  createOrderBody,
  getMyOrdersQuerySchema,
  getOrderListQuery,
} from "./order.validation";
import {
  authenticate,
  verifySession,
} from "../../middlewares/AuthenticateHelper";
import { guard } from "../../middlewares/guard";
import { guardCustomer } from "../../middlewares/guardCustomer";

const router = express.Router();
router.post(
  "/",
  guardCustomer,
  validate({ body: createOrderBody }),
  OrderController.createOrder,
);
// router.get(
//   "/me",
//   authenticate,
//   validate({ query: getOrderListQuery }),
//   OrderController.getAllOrder,
// );

router.get(
  "/my-orders",
  authenticate,
  verifySession,
  guard("customer"),
  validate({ query: getMyOrdersQuerySchema }),
  OrderController.getMyOrders,
);
router.get(
  "/",
  validate({ query: getOrderListQuery }),
  authenticate,
  verifySession,
  guard("super_admin","seller","staff","seller_staff"),
  OrderController.getAllOrder,
);
router.get(
  "/:orderId",
  // validate({ query: getOrderListQuery }),
  OrderController.getMyOrderById,
);
export const OrderRouter = router;
