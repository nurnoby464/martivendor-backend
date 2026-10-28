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
// import { DevRouter } from "./dev/fixIndexes";
const order_route_1 = require("./CRM/order/order.route");
const invoice_route_1 = require("./CRM/invoice/invoice.route");
const public_route_1 = require("./module/public/public.route");
const banner_route_1 = require("./module/siteManagement/banner/banner.route");
const events_1 = require("./shared/events");
const notificaiton_route_1 = require("./CRM/notification/notificaiton.route");
const subOrder_route_1 = require("./CRM/subOrder/subOrder.route");
const dashboard_route_1 = require("./CRM/dashboard/dashboard.route");
const sellerCustomer_route_1 = require("./CRM/sellerCustomer/sellerCustomer.route");
// routes
// import authRoutes from './modules/auth/auth.routes';
// import adminRoutes from './modules/admin/admin.routes';
// import vendorRoutes from './modules/vendor/vendor.routes';
// import customerRoutes from './modules/customer/customer.routes';
// import publicRoutes from './modules/public/public.routes';
const app = (0, express_1.default)();
app.set("trust proxy", 1);
const allowOrigin = [
    "http://localhost:3000",
    "https://multivendorforntend.vercel.app",
    "https://luzia-weld.vercel.app",
    "https://ankorabd.vercel.app",
    "https://ankorabd.com",
    "https://www.ankorabd.com",
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
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, morgan_1.default)("dev"));
const c = {
    reset: "\x1b[0m",
    dim: "\x1b[2m",
    bold: "\x1b[1m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
};
const SENSITIVE_KEYS = ["password", "token", "accessToken", "refreshToken", "otp"];
const mask = (_key, value) => SENSITIVE_KEYS.includes(_key) ? "***" : value;
const isEmpty = (obj) => !obj || (typeof obj === "object" && Object.keys(obj).length === 0);
const statusColor = (status) => {
    if (status >= 500)
        return c.red;
    if (status >= 400)
        return c.yellow;
    if (status >= 300)
        return c.cyan;
    return c.green;
};
const indent = (json) => json
    .split("\n")
    .map((line) => `   ${c.dim}│${c.reset} ${line}`)
    .join("\n");
if (process.env.NODE_ENV === "development") {
    app.use((0, morgan_1.default)((tokens, req, res) => {
        const method = tokens.method?.(req, res) ?? "UNKNOWN";
        const url = tokens.url?.(req, res) ?? "-";
        const status = Number(tokens.status?.(req, res)) || 0;
        const time = tokens["response-time"]?.(req, res) ?? "-";
        const timestamp = new Date().toLocaleTimeString("en-GB");
        const lines = [
            `${c.dim}${"─".repeat(60)}${c.reset}`,
            `${c.dim}${timestamp}${c.reset}  ${c.bold}${c.blue}${method}${c.reset} ${url}`,
            `   ${c.dim}Status${c.reset}  ${statusColor(status)}${status}${c.reset}`,
            `   ${c.dim}Time  ${c.reset}  ${time} ms`,
        ];
        const query = req.query;
        const body = req.body;
        if (!isEmpty(query)) {
            lines.push(`   ${c.dim}Query${c.reset}`);
            lines.push(indent(JSON.stringify(query, mask, 2)));
        }
        if (!isEmpty(body)) {
            lines.push(`   ${c.dim}Body${c.reset}`);
            lines.push(indent(JSON.stringify(body, mask, 2)));
        }
        return lines.join("\n");
    }));
}
else {
    app.use((0, morgan_1.default)("combined"));
}
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
// app.use("/api/v1/dev", DevRouter);
app.use("/api/v1/orders", order_route_1.OrderRouter);
app.use("/api/v1/sub-orders", subOrder_route_1.SubOrderRouter);
app.use("/api/v1/seller-customers", sellerCustomer_route_1.SellerCustomerRouter);
app.use("/api/v1/dashboard", dashboard_route_1.DashboardRouter);
app.use("/api/v1/invoices", invoice_route_1.InvoiceRouter);
app.use("/api/v1/banners", banner_route_1.BannerRouter);
app.use("/api/v1/notifications", notificaiton_route_1.NotificationRouter);
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