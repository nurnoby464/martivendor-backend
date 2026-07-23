"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// category.schema.ts
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
    parent_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Category",
        default: null,
    },
    path: {
        type: [mongoose_1.Schema.Types.ObjectId], // ✅ Array of ObjectIds
        default: [],
        index: true, // For faster queries
    },
    depth: {
        type: Number,
        default: 0,
    },
    image: {
        type: String,
        default: null,
    },
    is_active: {
        type: Boolean,
        default: true,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });
// Better indexes for array path
CategorySchema.index({ sellerId: 1, parent_id: 1 });
CategorySchema.index({ sellerId: 1, slug: 1, parent_id: 1 }, { unique: true });
CategorySchema.index({ sellerId: 1, path: 1 }); // Works with array
CategorySchema.index({ sellerId: 1, depth: 1 });
const Category = (0, mongoose_1.model)("Category", CategorySchema);
exports.default = Category;
//# sourceMappingURL=category.schema.js.map