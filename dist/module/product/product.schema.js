"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductCounter = void 0;
const mongoose_1 = require("mongoose");
const product_interface_1 = require("./product.interface");
const helper_1 = require("../../utils/helper");
// ── Counter for SKU sequence per seller ───────────────────────────────────────
const ProductCounterSchema = new mongoose_1.Schema({
    sellerId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    seq: { type: Number, default: 0 },
}, { collection: "product_counters" });
ProductCounterSchema.index({ sellerId: 1 }, { unique: true });
exports.ProductCounter = (0, mongoose_1.model)("ProductCounter", ProductCounterSchema);
// ── Helper: build SKU from product name ───────────────────────────────────────
function buildProductSku(name, seq) {
    const clean = (s) => s
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .slice(0, 10);
    return `${clean(name)}-${String(seq).padStart(4, "0")}`;
    // e.g. COTTON-SHIR-0001
}
// ── Product schema ────────────────────────────────────────────────────────────
const ProductSchema = new mongoose_1.Schema({
    sellerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Seller", required: true },
    categoryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    // vendorId: {
    //   type: Schema.Types.ObjectId,
    //   ref: "Vendor",
    //   required: true,
    // },
    name: {
        type: String,
        required: [true, "Product name is required"],
        trim: true,
        minlength: [2, "Name must be at least 2 characters"],
        maxlength: [200, "Name cannot exceed 200 characters"],
    },
    nameLower: {
        type: String,
        index: true,
    },
    slug: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    description: {
        type: String,
        default: null,
        trim: true,
    },
    productType: {
        type: String,
        enum: Object.values(product_interface_1.ProductType),
        required: true,
        default: product_interface_1.ProductType.NEW,
    },
    specification: {
        type: String,
        default: null,
        trim: true,
    },
    images: {
        type: [String],
        default: [],
    },
    sku: {
        type: String,
        trim: true,
        uppercase: true,
        // Filled by pre-save if not provided
    },
    // Pricing
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
    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    profit: {
        type: Number,
        default: 0,
    },
    profitMargin: {
        type: Number,
        default: 0,
    },
    // Stock (only when hasVariants = false)
    stock: {
        type: Number,
        default: 0,
        min: 0,
    },
    lowStockAlert: {
        type: Number,
        default: 10,
    },
    hasVariants: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    taxRate: {
        type: Number,
        default: 0,
    },
    displayPriceMin: {
        type: Number,
        default: 0,
    },
    displayPriceMax: {
        type: Number,
        default: 0,
    },
    totalStock: {
        type: Number,
        default: 0,
    },
    variantCount: {
        type: Number,
        default: 0,
    },
    hasDiscount: {
        type: Boolean,
        default: false,
    },
    tags: {
        type: [String],
        enum: Object.values(product_interface_1.ProductTag),
        default: [],
    },
    asin: {
        type: String,
        unique: true,
        index: true,
    },
    showOnHomepage: {
        type: Boolean,
        default: false,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });
// ── Auto-generate SKU & calculate profit ──────────────────────────────────────
ProductSchema.pre("save", async function () {
    if (this.isModified("name")) {
        this.nameLower = this.name.toLowerCase();
    }
    // Auto SKU only on new documents without a manually provided SKU
    if (this.isNew && !this.sku) {
        const counter = await exports.ProductCounter.findOneAndUpdate({ sellerId: this.sellerId }, { $inc: { seq: 1 } }, { upsert: true, new: true });
        this.sku = buildProductSku(this.name, counter.seq);
    }
    if (this.isNew && !this.asin) {
        let candidate = (0, helper_1.generateAsin)();
        // Ensure ASIN is unique
        for (let i = 0; i < 5; i++) {
            const existing = await (0, mongoose_1.model)("Product").exists({
                asin: candidate,
            });
            if (!existing)
                break;
            candidate = (0, helper_1.generateAsin)();
        }
        this.asin = candidate;
    }
    // Always recalculate profit
    this.profit = parseFloat((this.sellingPrice - this.buyingPrice).toFixed(2));
    this.profitMargin =
        this.sellingPrice > 0
            ? parseFloat(((this.profit / this.sellingPrice) * 100).toFixed(2))
            : 0;
    // Keep hasDiscount in sync with the actual discount value rather than
    // letting callers set it independently and drift out of sync.
    this.hasDiscount = this.discount > 0;
});
// ── Indexes ───────────────────────────────────────────────────────────────────
ProductSchema.index({ sellerId: 1, isActive: 1 });
ProductSchema.index({ sellerId: 1, categoryId: 1 });
// ProductSchema.index({ sellerId: 1, vendorId: 1 });
ProductSchema.index({ sellerId: 1, stock: 1 });
ProductSchema.index({ sellerId: 1, sku: 1 }, { unique: true });
ProductSchema.index({ slug: 1 });
ProductSchema.index({ sellerId: 1, showOnHomepage: 1 });
ProductSchema.index({ isActive: 1, nameLower: 1 });
const Product = (0, mongoose_1.model)("Product", ProductSchema);
exports.default = Product;
//# sourceMappingURL=product.schema.js.map