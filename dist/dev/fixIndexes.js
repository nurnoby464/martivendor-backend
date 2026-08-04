"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevRouter = exports.getPublicMergedCategories = void 0;
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
router.get("/home-category", async (req, res) => {
    const result = await (0, exports.getPublicMergedCategories)({ page: 1, limit: 10 });
    res.json({ num: result });
});
router.get("/extract", async (req, res) => {
    const { combinedSlug } = req.query;
    const result = (0, helper_1.extractAsin)(combinedSlug);
    res.json({ num: result });
});
router.post("/slug", async (req, res) => {
    const backfillSlugPaths = async () => {
        const depths = await category_schema_1.default.distinct("depth"); // e.g. [0, 1, 2]
        const sortedDepths = depths.sort((a, b) => a - b);
        for (const depth of sortedDepths) {
            const docs = await category_schema_1.default.find({
                depth,
                $or: [{ slugPath: { $exists: false } }, { slugPath: { $size: 0 } }],
            });
            console.log(`Depth ${depth}: ${docs.length} docs missing slugPath`);
            for (const doc of docs) {
                if (!doc.parentId) {
                    doc.slugPath = [doc.slug];
                }
                else {
                    const parent = await category_schema_1.default.findById(doc.parentId).lean();
                    if (!parent) {
                        console.warn(`Orphaned doc ${doc._id}: parent ${doc.parentId} not found`);
                        continue;
                    }
                    doc.slugPath = [...(parent.slugPath ?? [parent.slug]), doc.slug];
                }
                // bypass full validation re-run of unrelated required fields if needed
                await doc.save({ validateModifiedOnly: true });
            }
        }
        console.log("Backfill complete");
    };
    backfillSlugPaths();
    res.json({ num: "result" });
});
// reusable merge stage — dedupes any set of category docs by slugPath
const mergeBySlugPath = (matchStage) => [
    { $match: matchStage },
    {
        $group: {
            _id: "$slugPath",
            name: { $first: "$name" },
            depth: { $first: "$depth" },
            images: { $push: "$image" },
            sellerIds: { $addToSet: "$sellerId" },
        },
    },
    {
        $addFields: {
            slugPath: "$_id",
            slug: { $arrayElemAt: ["$_id", -1] },
            image: {
                $first: {
                    $filter: { input: "$images", cond: { $ne: ["$$this", null] } },
                },
            },
            sellerCount: { $size: "$sellerIds" },
        },
    },
    { $project: { images: 0, sellerIds: 0, _id: 0 } },
];
const getPublicMergedCategories = async (payload) => {
    const { page, limit } = payload;
    const skip = (page - 1) * limit;
    // 1. merged root categories, paginated
    const rootPipeline = [
        ...mergeBySlugPath({ isActive: true, depth: 0 }),
        { $sort: { sellerCount: -1, name: 1 } },
        {
            $facet: {
                data: [{ $skip: skip }, { $limit: limit }],
                meta: [{ $count: "total" }],
            },
        },
    ];
    const [rootResult] = await category_schema_1.default.aggregate(rootPipeline);
    const roots = rootResult?.data ?? [];
    const total = rootResult?.meta?.[0]?.total ?? 0;
    if (!roots.length)
        return { categories: [], total, page, limit };
    const rootSlugs = roots.map((r) => r.slug);
    // 2. merged descendants of ONLY those roots — any seller, matched
    //    by first element of slugPath (their root slug)
    const descendantPipeline = [
        ...mergeBySlugPath({
            isActive: true,
            depth: { $gt: 0 },
            "slugPath.0": { $in: rootSlugs },
        }),
        { $sort: { depth: 1, name: 1 } },
    ];
    const descendants = await category_schema_1.default.aggregate(descendantPipeline);
    const allNodes = [...roots, ...descendants].map((c) => ({
        slugPath: c.slugPath,
        slug: c.slug,
        name: c.name,
        depth: c.depth,
        parentSlugPath: c.slugPath.length > 1 ? c.slugPath.slice(0, -1) : null,
        image: c.image ?? null,
        sellerCount: c.sellerCount,
        hasChildren: false,
    }));
    // hasChildren — in-memory, one pass, same trick as searchCategories
    const parentKeySet = new Set(allNodes
        .filter((n) => n.parentSlugPath)
        .map((n) => n.parentSlugPath.join("/")));
    allNodes.forEach((n) => {
        n.hasChildren = parentKeySet.has(n.slugPath.join("/"));
    });
    // depth-first order, matching the flat-array contract your
    // CategoryTree/buildCategoryTree already expects on the dashboard
    const byParentKey = new Map();
    allNodes.forEach((n) => {
        if (!n.parentSlugPath)
            return;
        const key = n.parentSlugPath.join("/");
        if (!byParentKey.has(key))
            byParentKey.set(key, []);
        byParentKey.get(key).push(n);
    });
    const nodeByKey = new Map(allNodes.map((n) => [n.slugPath.join("/"), n]));
    const sorted = [];
    const visit = (node) => {
        sorted.push(node);
        (byParentKey.get(node.slugPath.join("/")) ?? [])
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach(visit);
    };
    roots.forEach((r) => visit(nodeByKey.get(r.slugPath.join("/"))));
    return { categories: sorted, total, page, limit };
};
exports.getPublicMergedCategories = getPublicMergedCategories;
exports.DevRouter = router;
//# sourceMappingURL=fixIndexes.js.map