import express from "express";
import * as StaffController from "./staff.controller";
import { validate } from "../../middlewares/validate";
import { customerQuerySchema } from "./staff.validation";
import { authenticate, verifySession } from "../../middlewares/AuthenticateHelper";
import { saleAnAuthenticateAndUnauthenticated } from "../../middlewares/saleAuthenticateAndUnauthenticate";

const router = express.Router();
router.get("/",authenticate,saleAnAuthenticateAndUnauthenticated, verifySession, validate({query:customerQuerySchema}), StaffController.getCustomerList)
export const CustomerRouter = router;
