"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts — ONLY Express config, routes, middleware
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const user_route_1 = require("./module/user/user.route");
const ErrorHandler_1 = require("./middlewares/ErrorHandler");
const auth_route_1 = require("./module/auth/auth.route");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const seller_route_1 = require("./module/seller/seller.route");
const vendor_route_1 = require("./module/vendor/vendor.route");
const category_route_1 = require("./module/category/category.route");
const product_route_1 = require("./module/product/product.route");
const purchase_route_1 = require("./module/purchase/purchase.route");
const product_variant_route_1 = require("./module/product-variant/product-variant.route");
const posSell_route_1 = require("./CRM/posSell/posSell.route");
const customer_route_1 = require("./CRM/customer/customer.route");
const fixIndexes_1 = require("./dev/fixIndexes");
const order_route_1 = require("./CRM/order/order.route");
const invoice_route_1 = require("./CRM/invoice/invoice.route");
const public_route_1 = require("./module/public/public.route");
const banner_route_1 = require("./module/siteManagement/banner/banner.route");
const events_1 = require("./shared/events");
const notificaiton_route_1 = require("./CRM/notification/notificaiton.route");
// routes
// import authRoutes from './modules/auth/auth.routes';
// import adminRoutes from './modules/admin/admin.routes';
// import vendorRoutes from './modules/vendor/vendor.routes';
// import customerRoutes from './modules/customer/customer.routes';
// import publicRoutes from './modules/public/public.routes';
const app = (0, express_1.default)();
const allowOrigin = [
    "http://localhost:3000",
    "https://multivendorforntend.vercel.app",
    "https://luzia-weld.vercel.app",
    "https://ankorabd.vercel.app",
    "https://ankorabd.com",
    "https://www.ankorabd.com"
];
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowOrigin.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,x-company-id,x-subdomain");
    res.setHeader("Access-Control-Expose-Headers", "X-Total-Count,X-Total-Pages");
    if (req.method === "OPTIONS")
        return res.sendStatus(204);
    next();
});
// Middlewares
app.use((0, helmet_1.default)());
// app.use(
//   cors({
//     origin: (origin, callback) => {
//       if (!origin) return callback(null, true);
//       if (allowOrigin.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new AppError(`CORS blocked: ${origin}`));
//       }
//     },
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
//     allowedHeaders: [
//       "Content-Type",
//       "Authorization",
//       "x-company-id",
//       "x-subdomain",
//     ],
//     exposedHeaders: ["X-Total-Count", "X-Total-Pages"],
//     credentials: true,
//   }),
// );
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// public route
app.use("/api/v1/public", public_route_1.PublicRoutes);
// how i give all dist
// Routes
app.use("/api/v1/auth", auth_route_1.AuthRoutes);
app.use("/api/v1/users", user_route_1.UsersRoute);
app.use("/api/v1/company", seller_route_1.CompanyRouter);
app.use("/api/v1/vendor", vendor_route_1.VendorRoutes);
app.use("/api/v1/category", category_route_1.CategoryRoutes);
app.use("/api/v1/products", product_route_1.ProductRoutes);
app.use("/api/v1/purchase", purchase_route_1.PurchaseRoute);
app.use("/api/v1/product-variant", product_variant_route_1.ProductVariantRoute);
app.use("/api/v1/sales", posSell_route_1.SaleRouter);
app.use("/api/v1/customer", customer_route_1.CustomerRouter);
app.use('/api/v1/dev', fixIndexes_1.DevRouter);
app.use('/api/v1/orders', order_route_1.OrderRouter);
app.use('/api/v1/invoices', invoice_route_1.InvoiceRouter);
app.use('/api/v1/banners', banner_route_1.BannerRouter);
app.use('/api/v1/notifications', notificaiton_route_1.NotificationRouter);
// Health check
app.get("/", (req, res) => {
    res.json({ success: true, message: "Welcome to Multi vendor e-commerce" });
});
app.get("/api/health", (req, res) => {
    res.json({ success: true, message: "Server is running" });
});
// ─── 404 — must come after all routes ────────────────────
app.use(ErrorHandler_1.notFoundHandler);
// ─── Global error handler — must be last, needs 4 params ─
app.use(ErrorHandler_1.globalErrorHandler);
(0, events_1.initializeEventListeners)();
exports.default = app;
// ✅ No listen() here
// ✅ No connectDB() here
//# sourceMappingURL=app.js.map