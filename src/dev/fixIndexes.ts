import { ObjectId, PipelineStage, Types } from "mongoose";
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
import express from "express";
import { generateInvoiceNumber, generateOderNumber } from "../utils/healper";
import { extractAsin, generateAsin } from "../utils/helper";
import Category from "../module/category/category.schema";
import Product from "../module/product/product.schema";
import { Seller } from "../module/seller/seller.schema";

const router = express.Router();
router.post("/generateOrderNumber", async (req, res) => {
  const companyId = new Types.ObjectId();
  const result = await generateOderNumber(companyId);
  res.json({ num: result });
});
router.post("/generateInvoiceNumber", async (req, res) => {
  const result = await generateInvoiceNumber();
  res.json({ num: result });
});
router.post("/generateAsin", async (req, res) => {
  const result = await generateAsin();
  res.json({ num: result });
});
router.get("/extract", async (req, res) => {
  const { combinedSlug } = req.query;
  const result = extractAsin(combinedSlug as string);
  res.json({ num: result });
});

router.get("/extract", async (req, res) => {
  const { combinedSlug } = req.query;
  const result = extractAsin(combinedSlug as string);
  res.json({ num: result });
});
router.put("/make-product-lower-name", async (req, res) => {
  const result = await Product.updateMany(
    {},
    [{ $set: { nameLower: { $toLower: "$name" } } }],
    { updatePipeline: true }, // ← tells Mongoose "yes, this array is an aggregation pipeline"
  );
  res.json({ num: result });
});
router.put("/make-seller-lower-name", async (req, res) => {
  const result = await Category.updateMany(
    {},
    [{ $set: { nameLower: { $toLower: "$name" } } }],
    { updatePipeline: true }, // ← tells Mongoose "yes, this array is an aggregation pipeline"
  );
  res.json({ num: result });
});

export const DevRouter = router;
