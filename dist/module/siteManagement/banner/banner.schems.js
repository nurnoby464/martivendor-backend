"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Banner = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const BannerSchema = new mongoose_1.Schema({
    companyId: { type: mongoose_1.Types.ObjectId, ref: "Seller", required: true },
    text: {
        type: String,
        trim: true,
        maxlength: [500, "Text cannot exceed 500 characters"],
        default: null,
    },
    imageUrl: {
        type: String,
        required: [true, "Image URL is required"],
        trim: true,
    },
    imagePublicId: {
        type: String,
        trim: true,
        select: false,
    },
    active: {
        type: Boolean,
        default: false,
        index: true,
    },
    order: {
        type: Number,
        default: 0,
        index: true,
    },
    linkUrl: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                if (!v)
                    return true;
                try {
                    new URL(v);
                    return true;
                }
                catch {
                    return false;
                }
            },
            message: "Please enter a valid URL",
        },
    },
    startDate: {
        type: Date,
        default: null,
    },
    // FIX 1: Simplified endDate validation without complex this typing
    endDate: {
        type: Date,
        default: null,
        validate: {
            validator: function (endDate) {
                // Access startDate through the document
                const doc = this;
                const startDate = doc.startDate;
                if (!startDate || !endDate)
                    return true;
                return new Date(endDate) > new Date(startDate);
            },
            message: "End date must be after start date",
        },
    },
}, {
    timestamps: true,
    // FIX 2: Handle imagePublicId deletion safely with type assertion
    toJSON: {
        transform: (_, ret) => {
            delete ret.__v;
            if (ret.imagePublicId !== undefined) {
                delete ret.imagePublicId;
            }
            return ret;
        },
    },
});
// Compound index
BannerSchema.index({ active: 1, order: 1, createdAt: -1 });
// Instance method
BannerSchema.methods.isActive = function () {
    if (!this.active)
        return false;
    const now = new Date();
    if (this.startDate && new Date(this.startDate) > now)
        return false;
    if (this.endDate && new Date(this.endDate) < now)
        return false;
    return true;
};
// Static method
BannerSchema.statics.getActiveBanners = async function () {
    const now = new Date();
    return this.find({
        active: true,
        $and: [
            {
                $or: [{ startDate: { $lte: now } }, { startDate: null }],
            },
            {
                $or: [{ endDate: { $gte: now } }, { endDate: null }],
            },
        ],
    }).sort({ order: 1, createdAt: -1 });
};
exports.Banner = mongoose_1.default.model("Banner", BannerSchema);
//# sourceMappingURL=banner.schems.js.map