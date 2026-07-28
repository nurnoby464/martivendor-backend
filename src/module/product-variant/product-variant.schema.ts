import { model, Schema } from "mongoose";
import Product from "../product/product.schema";
import { AppError } from "../../middlewares/appError";
import {
  IAttribute,
  IProductVariantDocument,
} from "./product-variant.interface";

// ── Helper: build variant SKU from parent SKU + attribute values ──────────────
// Parent SKU: "COTTON-SHIR-0001"
// Attributes: [{ color: Orange }, { size: M }]
// Result:     "COTTON-SHIR-0001-ORANGE-M"
function buildVariantSku(parentSku: string, attributes: IAttribute[]): string {
  const suffix = attributes
    .map((a) =>
      a.value
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .slice(0, 8)
    )
    .join("-");

  return `${parentSku}-${suffix}`;
}

// ── Attribute sub-schema ──────────────────────────────────────────────────────
const AttributeSchema = new Schema(
  {
    key: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

// ── Variant schema ────────────────────────────────────────────────────────────
const ProductVariantSchema = new Schema<IProductVariantDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },

    attributes: {
      type: [AttributeSchema],
      required: true,
      validate: {
        validator: (v: IAttribute[]) => v.length > 0,
        message: "At least one attribute is required",
      },
    },

    sku: {
      type: String,
      trim: true,
      uppercase: true,
      // Filled by pre-save if not provided
    },

    image: {
      type: String,
      default: null,
    },

    buyingPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    profit: {
      type: Number,
      default: 0,
    },

    profitMargin: {
      type: Number,
      default: 0,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    lowStockAlert: {
      type: Number,
      default: 5,
    },

    discountType: {
      type: String,
      enum: ["flat", "percentage"],
      default: null,
    },

    discountValue: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ── Auto-generate SKU if not provided ─────────────────────────────────────────
ProductVariantSchema.pre("save", async function () {
  if (this.isNew && !this.sku) {
    // Fetch parent product to get its SKU
    const parent = await Product.findById(this.productId).lean<any>();

    if (!parent) {
      throw new AppError("Parent product not found", 404);
    }

    this.sku = buildVariantSku(parent.sku, this.attributes);
    // e.g. "COTTON-SHIR-0001-ORANGE-M"
  }

  // Always recalculate profit
  this.profit = parseFloat(
    (this.sellingPrice - this.buyingPrice).toFixed(2)
  );

  this.profitMargin =
    this.sellingPrice > 0
      ? parseFloat(((this.profit / this.sellingPrice) * 100).toFixed(2))
      : 0;
});

// ── Indexes ───────────────────────────────────────────────────────────────────
ProductVariantSchema.index({ productId: 1, isActive: 1 });
ProductVariantSchema.index({ sellerId: 1, stock: 1 });
ProductVariantSchema.index({ sellerId: 1, sku: 1 }, { unique: true });

ProductVariantSchema.index({
  productId: 1,
  "attributes.key": 1,
  "attributes.value": 1,
});

const ProductVariant = model<IProductVariantDocument>(
  "ProductVariant",
  ProductVariantSchema
);

export default ProductVariant;