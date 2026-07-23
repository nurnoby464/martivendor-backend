"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.getProductById = exports.getProducts = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const slugify_1 = __importDefault(require("slugify"));
const product_schema_1 = __importDefault(require("./product.schema"));
const category_schema_1 = __importDefault(require("../category/category.schema"));
const vendor_schema_1 = __importDefault(require("../vendor/vendor.schema"));
const appError_1 = require("../../middlewares/appError");
const product_variant_schema_1 = __importDefault(require("../product-variant/product-variant.schema"));
const auditLogger_1 = require("../../utils/auditLogger");
const audit_interface_1 = require("../audit/audit.interface");
// ─── helpers ─────────────────────────────────────────────
const generateSlug = (name) => {
    const slug = (0, slugify_1.default)(name, { lower: true, strict: true });
    return slug || `product-${Date.now()}`;
};
// const assertUniqProductSku = async (
//   sku: string,
//   sellerId: mongoose.Types.ObjectId,
//   excludeId?: string,
// ) => {
//   const filter: Record<string, unknown> = { sellerId, sku };
//   if (excludeId) filter._id = { $ne: excludeId };
//   const exists = await Product.findOne(filter).lean();
//   if (exists) throw new AppError(`Product SKU "${sku}" already exists`, 409);
// };
// const assertUniqVariantSku = async (
//   sku: string,
//   sellerId: mongoose.Types.ObjectId,
//   excludeId?: string,
// ) => {
//   const filter: Record<string, unknown> = { sellerId, sku };
//   if (excludeId) filter._id = { $ne: excludeId };
//   const exists = await ProductVariant.findOne(filter).lean();
//   if (exists) throw new AppError(`Variant SKU "${sku}" already exists`, 409);
// };
// ─── Create product ───────────────────────────────────────
// export const createProduct = async (
//   payload: CreateProductInput & {
//     sellerId: mongoose.Types.ObjectId;
//     createdBy: mongoose.Types.ObjectId;
//   },
//   req: Request,
// ) => {
//   const { sellerId, createdBy, ...rest } = payload;
//   // validate category belongs to company
//   // const category = await Category.findOne({
//   //   _id: category_id,
//   //   sellerId,
//   //   is_active: true,
//   // }).lean();
//   // if (!category) throw new AppError("Category not found or inactive", 404);
//   const slug = generateSlug(rest.name);
//   // validate vendor belongs to company
//   // const vendor = await Vendor.findOne({
//   //   _id: vendor_id,
//   //   sellerId,
//   //   is_active: true,
//   // }).lean();
//   // if (!vendor) throw new AppError("Vendor not found or inactive", 404);
//   // unique slug check
//   const slugExists = await Product.findOne({ sellerId, slug }).lean();
//   if (slugExists)
//     throw new AppError(`Product "${rest.name}" already exists`, 409);
//   const product = await Product.create(
//     sanitizeData({ ...rest, sellerId, createdBy, slug }),
//   );
//   auditLog({
//     req,
//     action: AUDIT_ACTIONS.PRODUCT_CREATED,
//     targetModel: "Product",
//     targetId: product._id,
//     after: {
//       name: product.name,
//       slug: product.slug,
//       buying_price: product.buying_price,
//       selling_price: product.selling_price,
//       description: product.description,
//       category_id: product.category_id,
//       vendor_id: product.vendor_id,
//     },
//   });
//   return product;
// };
// ─── Get all products (paginated) ────────────────────────
const getProducts = async (payload) => {
    const { sellerId, page, limit, search, category_id, vendor_id, has_variants, is_active, low_stock, sort_by, sort_order, } = payload;
    if (!sellerId)
        throw new appError_1.AppError("sellerId is required", 400);
    const filter = { sellerId };
    if (is_active !== undefined)
        filter.is_active = is_active;
    if (has_variants !== undefined)
        filter.has_variants = has_variants;
    if (category_id) {
        const allDescendantCategories = await category_schema_1.default.find({
            sellerId,
            path: new mongoose_1.default.Types.ObjectId(category_id), // ✅ array contains match
            is_active: true,
        }).lean();
        const allCategoryIds = [
            new mongoose_1.default.Types.ObjectId(category_id),
            ...allDescendantCategories.map((c) => c._id),
        ];
        filter.category_id = { $in: allCategoryIds };
    }
    if (vendor_id)
        filter.vendor_id = vendor_id;
    // low stock filter — stock <= low_stock_alert
    if (low_stock === "true") {
        filter.$expr = { $lte: ["$stock", "$low_stock_alert"] };
    }
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { sku: { $regex: search, $options: "i" } },
        ];
    }
    const sortDir = sort_order === "asc" ? 1 : -1;
    const [products, total] = await Promise.all([
        product_schema_1.default.find(filter)
            .populate("category_id", "name slug depth")
            // .populate("vendor_id", "name phone")
            .sort({ [sort_by]: sortDir })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        product_schema_1.default.countDocuments(filter),
    ]);
    return { products, total };
};
exports.getProducts = getProducts;
// ─── Get one product ──────────────────────────────────────
const getProductById = async (payload) => {
    const product = await product_schema_1.default.findOne({
        _id: payload.id,
        sellerId: payload.sellerId,
    })
        .populate("category_id", "name slug path depth")
        // .populate("vendor_id", "name phone email")
        .populate("createdBy", "name email")
        .lean();
    if (!product)
        throw new appError_1.AppError("Product not found", 404);
    // attach variants if has_variants
    let variants = [];
    if (product.has_variants) {
        variants = await product_variant_schema_1.default.find({
            sellerId: payload.sellerId,
            product_id: payload.id,
            is_active: true,
        }).lean();
    }
    return { product, variants };
};
exports.getProductById = getProductById;
// ─── Update product ───────────────────────────────────────
const updateProduct = async (payload) => {
    const { id, sellerId, data } = payload;
    const product = await product_schema_1.default.findOne({ _id: id, sellerId });
    if (!product)
        throw new appError_1.AppError("Product not found", 404);
    // validate new category if changing
    if (data.category_id) {
        const category = await category_schema_1.default.findOne({
            _id: data.category_id,
            sellerId,
            is_active: true,
        }).lean();
        if (!category)
            throw new appError_1.AppError("Category not found or inactive", 404);
        product.category_id = new mongoose_1.default.Types.ObjectId(data.category_id);
    }
    // validate new vendor if changing
    if (data.vendor_id) {
        const vendor = await vendor_schema_1.default.findOne({
            _id: data.vendor_id,
            sellerId,
            is_active: true,
        }).lean();
        if (!vendor)
            throw new appError_1.AppError("Vendor not found or inactive", 404);
        // product.vendor_id = new mongoose.Types.ObjectId(data.vendor_id);
    }
    const before = {
        name: product.name,
        sellerId: product.sellerId,
        category_id: product.category_id,
        // vendor_id: product.vendor_id,
    };
    // regenerate slug if name changes
    if (data.name && data.name !== product.name) {
        const newSlug = generateSlug(data.name);
        const slugExists = await product_schema_1.default.findOne({
            sellerId,
            slug: newSlug,
            _id: { $ne: id },
        }).lean();
        if (slugExists)
            throw new appError_1.AppError(`Product "${data.name}" already exists`, 409);
        product.slug = newSlug;
        product.name = data.name;
    }
    // block manual stock update if has_variants
    if (data.stock !== undefined && product.has_variants) {
        throw new appError_1.AppError("Cannot set stock directly on a product with variants", 400);
    }
    if (data.description !== undefined)
        product.description = data.description;
    if (data.images !== undefined)
        product.images = data.images;
    if (data.buying_price !== undefined)
        product.buying_price = data.buying_price;
    if (data.selling_price !== undefined)
        product.selling_price = data.selling_price;
    if (data.stock !== undefined)
        product.stock = data.stock;
    if (data.low_stock_alert !== undefined)
        product.low_stock_alert = data.low_stock_alert;
    if (data.is_active !== undefined)
        product.is_active = data.is_active;
    await product.save(); // pre-save hook recalculates profit + margin
    (0, auditLogger_1.auditLog)({
        req: payload.req,
        action: audit_interface_1.AUDIT_ACTIONS.PRODUCT_UPDATED,
        targetModel: "Product",
        targetId: product._id,
        before: before,
        after: {
            name: product.name,
            slug: product.slug,
            buying_price: product.buying_price,
            selling_price: product.selling_price,
            sellerId: product.sellerId,
            category_id: product.category_id,
            // vendor_id: product.vendor_id,
        },
    });
    return product;
};
exports.updateProduct = updateProduct;
// ─── Delete product ───────────────────────────────────────
const deleteProduct = async (payload) => {
    const { id, sellerId } = payload;
    const product = await product_schema_1.default.findOne({ _id: id, sellerId });
    if (!product)
        throw new appError_1.AppError("Product not found", 404);
    const before = {
        name: product.name,
    };
    // soft delete product
    product.is_active = false;
    await product.save();
    // soft delete all variants
    if (product.has_variants) {
        await product_variant_schema_1.default.updateMany({ product_id: id }, { is_active: false });
    }
    (0, auditLogger_1.auditLog)({
        req: payload.req,
        action: audit_interface_1.AUDIT_ACTIONS.PRODUCT_DELETED,
        targetModel: "Product",
        targetId: product._id,
        before: before,
        after: null,
    });
    return product;
};
exports.deleteProduct = deleteProduct;
//# sourceMappingURL=product.service.js.map