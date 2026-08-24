// src/app.ts — ONLY Express config, routes, middleware
import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { UsersRoute } from "./module/user/user.route";
import {
  globalErrorHandler,
  notFoundHandler,
} from "./middlewares/ErrorHandler";
import { AuthRoutes } from "./module/auth/auth.route";
import cookieParser from "cookie-parser";
import { CompanyRouter } from "./module/seller/seller.route";
import { VendorRoutes } from "./module/vendor/vendor.route";
import { CategoryRoutes } from "./module/category/category.route";
import { ProductRoutes } from "./module/product/product.route";
import { PurchaseRoute } from "./module/purchase/purchase.route";
import { ProductVariantRoute } from "./module/product-variant/product-variant.route";
import { AppError } from "./middlewares/appError";
import { SaleRouter } from "./CRM/posSell/posSell.route";
import { CustomerRouter } from "./CRM/customer/customer.route";
import { DevRouter } from "./dev/fixIndexes";
import { OrderRouter } from "./CRM/order/order.route";
import { InvoiceRouter } from "./CRM/invoice/invoice.route";
import { PublicRoutes } from "./module/public/public.route";
import { BannerRouter } from "./module/siteManagement/banner/banner.route";
import { initializeEventListeners } from "./shared/events";

// routes
// import authRoutes from './modules/auth/auth.routes';
// import adminRoutes from './modules/admin/admin.routes';
// import vendorRoutes from './modules/vendor/vendor.routes';
// import customerRoutes from './modules/customer/customer.routes';
// import publicRoutes from './modules/public/public.routes';

const app: Application = express();
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

  if (req.method === "OPTIONS") return res.sendStatus(204);

  next();
});

// Middlewares
app.use(helmet());
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
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// public route
app.use("/api/v1/public", PublicRoutes);
// how i give all dist

// Routes
app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/users", UsersRoute);
app.use("/api/v1/company", CompanyRouter);
app.use("/api/v1/vendor", VendorRoutes);
app.use("/api/v1/category", CategoryRoutes);
app.use("/api/v1/products", ProductRoutes);
app.use("/api/v1/purchase", PurchaseRoute);
app.use("/api/v1/product-variant", ProductVariantRoute);
app.use("/api/v1/sales", SaleRouter);
app.use("/api/v1/customer", CustomerRouter);
app.use('/api/v1/dev', DevRouter);
app.use('/api/v1/orders', OrderRouter);
app.use('/api/v1/invoices', InvoiceRouter);
app.use('/api/v1/banners', BannerRouter);


// Health check
app.get("/", (req, res) => {
  res.json({ success: true, message: "Welcome to Multi vendor e-commerce" });
});
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

// ─── 404 — must come after all routes ────────────────────
app.use(notFoundHandler);

// ─── Global error handler — must be last, needs 4 params ─
app.use(globalErrorHandler);

initializeEventListeners();
export default app;
// ✅ No listen() here
// ✅ No connectDB() here
