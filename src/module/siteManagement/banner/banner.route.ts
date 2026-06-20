import { Router } from "express";
import * as BannerController from "../banner/banner.controller";

import {
  createBannerSchema,
  updateBannerSchema,
  getBannersQuerySchema,
  deleteBannerSchema,
  getBannerSchema,
  bulkUpdateBannersSchema,
  BannerParams,
} from "../banner/banner.validation";
import { validate } from "../../../middlewares/validate";
import { companyIdentifier } from "../../../middlewares/companyIdentifier";
import {
  authenticate,
  verifySession,
} from "../../../middlewares/AuthenticateHelper";
import { guard } from "../../../middlewares/guard";

const router = Router();

// Public routes (no auth required for getting active banners)
router.get("/active",companyIdentifier, BannerController.getActiveBanners);

// Admin routes (add authentication middleware in production)
router.get(
  "/",
  validate({ query: getBannersQuerySchema }),
  companyIdentifier,
  BannerController.getAllBanners,
);

router.get(
  "/:id",
  validate({ params: getBannerSchema }),
  BannerController.getBannerById,
);

router.post(
  "/",
  validate({ body: createBannerSchema }),
  authenticate,
  verifySession,
  guard("super_admin", "admin"),
  BannerController.createBanner,
);

router.put(
  "/:id",
  validate({ params: BannerParams, body: updateBannerSchema }),
  authenticate,
  verifySession,
  guard("super_admin", "admin"),
  BannerController.updateBanner,
);

router.patch(
  "/:id/toggle",
  validate({ params: getBannerSchema }),
  authenticate,
  verifySession,
  guard("super_admin", "admin"),
  BannerController.toggleBannerStatus,
);

router.delete(
  "/:id",
  validate({ params: deleteBannerSchema }),
  authenticate,
  verifySession,
  guard("super_admin", "admin"),
  BannerController.deleteBanner,
);

router.post(
  "/bulk/update-orders",
  validate({ body: bulkUpdateBannersSchema }),
  authenticate,
  verifySession,
  guard("super_admin", "admin"),
  BannerController.bulkUpdateOrders,
);

router.post(
  "/bulk/delete",
  authenticate,
  verifySession,
  guard("super_admin", "admin"),
  BannerController.deleteMultipleBanners,
);

export const BannerRouter = router;
