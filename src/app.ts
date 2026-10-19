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
// import { DevRouter } from "./dev/fixIndexes";
import { OrderRouter } from "./CRM/order/order.route";
import { InvoiceRouter } from "./CRM/invoice/invoice.route";
import { PublicRoutes } from "./module/public/public.route";
import { BannerRouter } from "./module/siteManagement/banner/banner.route";
import { initializeEventListeners } from "./shared/events";
import { NotificationRouter } from "./CRM/notification/notificaiton.route";

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
  "https://www.ankorabd.com",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowOrigin.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,x-company-id,x-subdomain",
  );
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(morgan("dev"));

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

const mask = (_key: string, value: unknown) =>
  SENSITIVE_KEYS.includes(_key) ? "***" : value;

const isEmpty = (obj: unknown) =>
  !obj || (typeof obj === "object" && Object.keys(obj as object).length === 0);

const statusColor = (status: number) => {
  if (status >= 500) return c.red;
  if (status >= 400) return c.yellow;
  if (status >= 300) return c.cyan;
  return c.green;
};

const indent = (json: string) =>
  json
    .split("\n")
    .map((line) => `   ${c.dim}│${c.reset} ${line}`)
    .join("\n");

if (process.env.NODE_ENV === "development") {
  app.use(
    morgan((tokens, req, res) => {
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

      const query = (req as any).query;
      const body = (req as any).body;

      if (!isEmpty(query)) {
        lines.push(`   ${c.dim}Query${c.reset}`);
        lines.push(indent(JSON.stringify(query, mask, 2)));
      }
      if (!isEmpty(body)) {
        lines.push(`   ${c.dim}Body${c.reset}`);
        lines.push(indent(JSON.stringify(body, mask, 2)));
      }

      return lines.join("\n");
    }),
  );
} else {
  app.use(morgan("combined"));
}

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
// app.use("/api/v1/dev", DevRouter);
app.use("/api/v1/orders", OrderRouter);
app.use("/api/v1/invoices", InvoiceRouter);
app.use("/api/v1/banners", BannerRouter);
app.use("/api/v1/notifications", NotificationRouter);

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
