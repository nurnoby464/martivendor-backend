import { Router } from "express";
import { validate } from "../../middlewares/validate";
import {
  authenticate,
  verifySession,
} from "../../middlewares/AuthenticateHelper";
import { guard } from "../../middlewares/guard";
import * as ProductVariantController from "./product-variant.controller";
import {
  createVariantSchema,
  editProductVariantSchema,
  myInventoryQuerySchema,
  productVariantParamsSchema,
  productVariantQuerySchema,
  updateVariantSchema,
  variantParamsSchema,
} from "./product-variant.validation";
import { companyIdentifier } from "../../middlewares/companyIdentifier";
const variantRouter = Router({ mergeParams: true }); // mergeParams to access :id from parent

variantRouter
  .route("/all-products")
  .get(
    validate({ query: productVariantQuerySchema }),
    authenticate,
    verifySession,
    ProductVariantController.getAllProductWithVariant,
  );
variantRouter
  .route("/my-inventory")
  .get(
    authenticate,
    verifySession,
    guard("super_admin","seller","seller_staff","staff"),
    validate({ query: myInventoryQuerySchema }),
    ProductVariantController.getMyInventory,
  );

variantRouter
  .route("/")
  .get(
    validate({ params: variantParamsSchema }),
    authenticate,
    verifySession,
    guard("super_admin", "admin", "inventory", "sales", "report"),
    ProductVariantController.getVariants,
  )
  .post(
    validate({ params: variantParamsSchema, body: createVariantSchema }),
    authenticate,
    verifySession,
    guard("super_admin", "admin", "inventory"),
    ProductVariantController.createVariant,
  );
variantRouter
  .route("/edit")
  .patch(
    authenticate,
    verifySession,
    guard("super_admin", "admin", "inventory"),
    validate({ body: editProductVariantSchema }),
    ProductVariantController.editProductVariant,
  );

variantRouter
  .route("/:variantId")
  .get(
    validate({ params: productVariantParamsSchema }),
    authenticate,
    verifySession,
    guard("super_admin", "admin", "inventory", "sales", "report"),
    ProductVariantController.getVariantById,
  )
  .patch(
    validate({ params: productVariantParamsSchema, body: updateVariantSchema }),
    authenticate,
    verifySession,
    guard("super_admin", "admin", "inventory"),
    ProductVariantController.updateVariant,
  )
  .delete(
    validate({ params: productVariantParamsSchema }),
    authenticate,
    verifySession,
    guard("super_admin", "admin"),
    ProductVariantController.deleteVariant,
  );

export const ProductVariantRoute = variantRouter;
