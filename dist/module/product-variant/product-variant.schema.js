"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const product_schema_1 = __importDefault(require("../product/product.schema")); // to read parent SKU
const appError_1 = require("../../middlewares/appError");
// ── Helper: build variant SKU from parent SKU + attribute values ───────────────
//    parent SKU:  "COTTON-SHIR-0001"
//    attributes:  [{color: Orange}, {size: M}]
//    result:      "COTTON-SHIR-0001-ORANGE-M"
function buildVariantSku(parentSku, attributes) {
    const suffix = attributes
        .map((a) => a.value
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .slice(0, 8))
        .join("-");
    return `${parentSku}-${suffix}`;
}
// ── Attribute sub-schema ──────────────────────────────────────────────────────
const AttributeSchema = new mongoose_1.Schema({
    key: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
}, { _id: false });
// ── Variant schema ────────────────────────────────────────────────────────────
const ProductVariantSchema = new mongoose_1.Schema({
    product_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "Product", required: true },
    sellerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Seller", required: true },
    attributes: {
        type: [AttributeSchema],
        required: true,
        validate: {
            validator: (v) => v.length > 0,
            message: "At least one attribute is required",
        },
    },
    sku: {
        type: String,
        trim: true,
        uppercase: true,
        // filled by pre-save if not provided
    },
    image: { type: String, default: null }, // ← e.g. Cloudinary URL for orange shirt
    buying_price: { type: Number, required: true, min: 0 },
    selling_price: { type: Number, required: true, min: 0 },
    profit: { type: Number, default: 0 },
    profit_margin: { type: Number, default: 0 },
    stock: { type: Number, default: 0, min: 0 },
    low_stock_alert: { type: Number, default: 5 },
    // in product-variant.schema.ts
    discountType: {
        type: String,
        enum: ["flat", "percentage"],
        default: null,
    },
    discountValue: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
}, { timestamps: true });
// ── Auto-generate SKU if not provided ────────────────────────────────────────
ProductVariantSchema.pre("save", async function () {
    if (this.isNew && !this.sku) {
        // Fetch parent product to get its SKU
        const parent = await product_schema_1.default.findById(this.product_id).lean();
        if (!parent)
            throw new appError_1.AppError("Parent product not found", 404);
        this.sku = buildVariantSku(parent.sku, this.attributes);
        // e.g. "COTTON-SHIR-0001-ORANGE-M"
    }
    // Always recalculate profit
    this.profit = parseFloat((this.selling_price - this.buying_price).toFixed(2));
    this.profit_margin =
        this.selling_price > 0
            ? parseFloat(((this.profit / this.selling_price) * 100).toFixed(2))
            : 0;
});
// ── Indexes ───────────────────────────────────────────────────────────────────
ProductVariantSchema.index({ product_id: 1, is_active: 1 });
ProductVariantSchema.index({ sellerId: 1, stock: 1 });
ProductVariantSchema.index({ sellerId: 1, sku: 1 }, { unique: true });
ProductVariantSchema.index({
    product_id: 1,
    "attributes.key": 1,
    "attributes.value": 1,
});
const ProductVariant = (0, mongoose_1.model)("ProductVariant", ProductVariantSchema);
exports.default = ProductVariant;
//# sourceMappingURL=product-variant.schema.js.map