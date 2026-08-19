"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevRouter = void 0;
const mongoose_1 = require("mongoose");
// import dotenv from "dotenv";
// dotenv.config();
// import mongoose from "mongoose";
// const fix = async () => {
//   await mongoose.connect(process.env.MONGO_URI!);
//   const collection = mongoose.connection.db!.collection("companies");
//   // ── drop old indexes ────────────────────────────────────
//   try { await collection.dropIndex("domain_1");    console.log("✅ dropped domain_1"); }
//   catch { console.log("domain_1 not found"); }
//   try { await collection.dropIndex("subdomain_1"); console.log("✅ dropped subdomain_1"); }
//   catch { console.log("subdomain_1 not found"); }
//   // ── recreate with partialFilterExpression ───────────────
//   // only indexes documents where field is an actual string
//   // null and missing fields are completely ignored
//   await collection.createIndex(
//     { domain: 1 },
//     {
//       unique                 : true,
//       partialFilterExpression: { domain: { $type: "string" } },
//       name                   : "domain_1",
//     }
//   );
//   await collection.createIndex(
//     { subdomain: 1 },
//     {
//       unique                 : true,
//       partialFilterExpression: { subdomain: { $type: "string" } },
//       name                   : "subdomain_1",
//     }
//   );
//   console.log("✅ Indexes recreated with partialFilterExpression");
//   await mongoose.disconnect();
// };
// fix().catch(console.error);
const express_1 = __importDefault(require("express"));
const healper_1 = require("../utils/healper");
const helper_1 = require("../utils/helper");
const category_schema_1 = __importDefault(require("../module/category/category.schema"));
const product_schema_1 = __importDefault(require("../module/product/product.schema"));
const router = express_1.default.Router();
router.post("/generateOrderNumber", async (req, res) => {
    const companyId = new mongoose_1.Types.ObjectId();
    const result = await (0, healper_1.generateOderNumber)(companyId);
    res.json({ num: result });
});
router.post("/generateInvoiceNumber", async (req, res) => {
    const result = await (0, healper_1.generateInvoiceNumber)();
    res.json({ num: result });
});
router.post("/generateAsin", async (req, res) => {
    const result = await (0, helper_1.generateAsin)();
    res.json({ num: result });
});
router.get("/extract", async (req, res) => {
    const { combinedSlug } = req.query;
    const result = (0, helper_1.extractAsin)(combinedSlug);
    res.json({ num: result });
});
router.get("/extract", async (req, res) => {
    const { combinedSlug } = req.query;
    const result = (0, helper_1.extractAsin)(combinedSlug);
    res.json({ num: result });
});
router.put("/make-product-lower-name", async (req, res) => {
    const result = await product_schema_1.default.updateMany({}, [{ $set: { nameLower: { $toLower: "$name" } } }], { updatePipeline: true });
    res.json({ num: result });
});
router.put("/make-seller-lower-name", async (req, res) => {
    const result = await category_schema_1.default.updateMany({}, [{ $set: { nameLower: { $toLower: "$name" } } }], { updatePipeline: true });
    res.json({ num: result });
});
exports.DevRouter = router;
//# sourceMappingURL=fixIndexes.js.map