"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const CategorySchema = new mongoose_1.Schema({
    sellerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "sellerId",
        required: [true, "sellerId is required"],
    },
    name: {
        type: String,
        required: [true, "Category name is required"],
        trim: true,
        minlength: [2, "Min 2 characters"],
        maxlength: [100, "Max 100 characters"],
    },
    slug: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    // Full slug path from root to this category, e.g. ["electronics", "mobile-phones"]
    // Used to merge identical category trees across different sellers on public/homepage views
    slugPath: {
        type: [String],
        default: [],
        index: true,
    },
    parentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Category",
        default: null,
    },
    path: {
        type: [mongoose_1.Schema.Types.ObjectId], // ancestor IDs, root → immediate parent
        default: [],
        index: true,
    },
    depth: {
        type: Number,
        default: 0,
    },
    image: {
        type: String,
        default: null,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });
// ─── Auto-compute path / depth / slugPath on every save ──────────
// This runs no matter how the document is saved — through a service,
// a migration script, or the Mongo shell — so these derived fields
// can never be forgotten or set incorrectly by hand.
CategorySchema.pre("save", async function () {
    const CategoryModel = this.constructor;
    if (!this.parentId) {
        this.path = [];
        this.depth = 0;
        this.slugPath = [this.slug];
        return;
    }
    if (this.isModified("parentId") ||
        this.isModified("slug") ||
        !this.slugPath?.length) {
        const parent = await CategoryModel.findById(this.parentId).lean();
        if (!parent) {
            throw new Error("Parent category not found");
        }
        this.path = [...(parent.path ?? []), parent._id];
        this.depth = (parent.depth ?? 0) + 1;
        this.slugPath = [...(parent.slugPath ?? [parent.slug]), this.slug];
    }
});
// ─── Indexes (field names corrected to match schema: parentId, not parent_id) ──
CategorySchema.index({ sellerId: 1, parentId: 1 });
CategorySchema.index({ sellerId: 1, slug: 1, parentId: 1 }, { unique: true });
CategorySchema.index({ sellerId: 1, path: 1 });
CategorySchema.index({ sellerId: 1, depth: 1 });
CategorySchema.index({ slug: 1, parentId: 1 }); // supports public/homepage root grouping
const Category = (0, mongoose_1.model)("Category", CategorySchema);
exports.default = Category;
//# sourceMappingURL=category.schema.js.map