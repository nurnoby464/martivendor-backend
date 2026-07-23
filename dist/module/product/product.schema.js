"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductCounter = void 0;
const mongoose_1 = require("mongoose");
// ── Counter for SKU sequence per company ──────────────────────────────────────
const ProductCounterSchema = new mongoose_1.Schema({
    sellerId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    seq: { type: Number, default: 0 },
}, { collection: "product_counters" });
ProductCounterSchema.index({ sellerId: 1 }, { unique: true });
exports.ProductCounter = (0, mongoose_1.model)("ProductCounter", ProductCounterSchema);
// ── Helper: build SKU from category name + product name ───────────────────────
function buildProductSku(name, seq) {
    const clean = (s) => s
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .slice(0, 10);
    return `${clean(name)}-${String(seq).padStart(4, "0")}`;
    // e.g. "COTTON-SHIR-0001"
}
// ── Product schema ────────────────────────────────────────────────────────────
const ProductSchema = new mongoose_1.Schema({
    sellerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Seller", required: true },
    category_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    vendor_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "Vendor", required: true },
    name: {
        type: String,
        required: [true, "Product name is required"],
        trim: true,
        minlength: [2, "Name must be at least 2 characters"],
        maxlength: [200, "Name cannot exceed 200 characters"],
    },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: null, trim: true },
    images: { type: [String], default: [] },
    sku: {
        type: String,
        trim: true,
        uppercase: true,
        // filled by pre-save if not provided by user
    },
    // pricing
    buying_price: { type: Number, required: true, min: 0 },
    selling_price: { type: Number, required: true, min: 0 },
    profit: { type: Number, default: 0 },
    profit_margin: { type: Number, default: 0 },
    // stock (only relevant when has_variants = false)
    stock: { type: Number, default: 0, min: 0 },
    low_stock_alert: { type: Number, default: 10 },
    has_variants: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    taxRate: { type: Number, default: 0 },
    display_price_min: { type: Number, default: 0 },
    display_price_max: { type: Number, default: 0 },
    total_stock: { type: Number, default: 0 },
    variant_count: { type: Number, default: 0 },
    has_discount: { type: Boolean, default: false },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
// ── Auto-generate SKU if not provided ────────────────────────────────────────
ProductSchema.pre("save", async function () {
    // Auto SKU only on new documents without a manually provided SKU
    if (this.isNew && !this.sku) {
        const counter = await exports.ProductCounter.findOneAndUpdate({ sellerId: this.sellerId }, { $inc: { seq: 1 } }, { upsert: true, new: true });
        this.sku = buildProductSku(this.name, counter.seq);
    }
    // Always recalculate profit
    this.profit = parseFloat((this.selling_price - this.buying_price).toFixed(2));
    this.profit_margin =
        this.selling_price > 0
            ? parseFloat(((this.profit / this.selling_price) * 100).toFixed(2))
            : 0;
});
// ── Indexes ───────────────────────────────────────────────────────────────────
ProductSchema.index({ sellerId: 1, is_active: 1 });
ProductSchema.index({ sellerId: 1, category_id: 1 });
// ProductSchema.index({ sellerId: 1, vendor_id: 1 });
ProductSchema.index({ sellerId: 1, stock: 1 });
ProductSchema.index({ sellerId: 1, sku: 1 }, { unique: true });
ProductSchema.index({ sellerId: 1, slug: 1 }, { unique: true });
const Product = (0, mongoose_1.model)("Product", ProductSchema);
exports.default = Product;
//# sourceMappingURL=product.schema.js.map