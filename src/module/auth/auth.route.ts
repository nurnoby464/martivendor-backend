import express from "express";
import * as AuthController  from "./auth.controller";
import { validate } from "../../middlewares/validate";
import {
  loginSchema,
  sessionParamsSchema,
  updatePasswordSchema,
} from "./auth.schema";
import {
  authenticate,
  verifySession,
} from "../../middlewares/AuthenticateHelper";
import { registerCustomerSchema, registerSellerSchema } from "../user/user.validation";
import { companyIdentifier } from "../../middlewares/companyIdentifier";
import { resendOTPSchema, UpdateProfileSchema, validateOTPSchema } from "./auth.validation";
const router = express.Router();
// public
router.post("/login", validate({ body: loginSchema }), AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post(
  "/register",
  validate({ body: registerCustomerSchema }),
  companyIdentifier,
  AuthController.registerCustomer,
);
router.post(
  "/be-seller",
  validate({ body: registerSellerSchema }),
  AuthController.registerSeller,
);
router.post(
  "/be-seller-otp",
  validate({ body: validateOTPSchema }),
  AuthController.verifySellerOPT,
);
router.post(
  "/resend-otp",
  validate({ body: resendOTPSchema }),
  AuthController.resendOPT,
);
router.delete(
  "/session/:userId/:sessionId",
  validate({ params: sessionParamsSchema }),
  AuthController.removeSession,
);

// protected
router.post("/logout", AuthController.logout);
router.use(authenticate);
router.use(verifySession);
router.patch(
  "/update-password",
  validate({ body: updatePasswordSchema }),
  AuthController.updatePassword,
);
router.put(
  "/update-profile",
  validate({ body: UpdateProfileSchema }),
  AuthController.updateProfile,
);

router.get("/me", AuthController.getMe);

export const AuthRoutes = router;
