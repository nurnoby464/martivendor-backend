"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatus = exports.updateTags = exports.getMyCustomers = void 0;
const helper_1 = require("../../utils/helper");
const sellerCustomer_schema_1 = __importDefault(require("./sellerCustomer.schema"));
const useSkip_1 = require("../../utils/useSkip");
const appError_1 = require("../../middlewares/appError");
const LIST_FIELDS = "customerId name phone source totalOrders totalPurchased totalPaid due credit tags lastPurchasedAt isActive createdAt ";
const getMyCustomers = async (query, sellerId) => {
    const { page, phone, search, sortBy, sortOrder, isActive, limit, source, hasDue, } = query;
    const filter = {
        sellerId,
        isActive: isActive ?? true,
    };
    if (phone)
        filter.phone = phone;
    if (search) {
        const rx = { $regex: (0, helper_1.escapeRegex)(search), $options: "i" };
        filter.$or = [{ name: rx }, { phone: rx }];
    }
    if (source) {
        filter.source = source;
    }
    if (hasDue) {
        filter.due = { $gt: 0 };
    }
    const [customers, total] = await Promise.all([
        sellerCustomer_schema_1.default.find(filter)
            .select(LIST_FIELDS)
            .sort({ [sortBy]: sortOrder })
            .skip((0, useSkip_1.useSkip)({ page, limit }))
            .limit(limit)
            .lean(),
        sellerCustomer_schema_1.default.countDocuments(filter),
    ]);
    return { customers, total, page, limit };
};
exports.getMyCustomers = getMyCustomers;
const updateTags = async (sellerCustomerId, input) => {
    const { tags } = input;
    const uniqueTags = [...new Set(tags)];
    const result = await sellerCustomer_schema_1.default.findOneAndUpdate({
        _id: sellerCustomerId,
    }, {
        $set: {
            tags: uniqueTags,
        },
    }, { returnDocument: "after", runValidators: true });
    if (!result) {
        throw new appError_1.AppError("Seller customer not found", 404);
    }
    return result;
};
exports.updateTags = updateTags;
const updateStatus = async (sellerCustomerId, input) => {
    const { isActive } = input;
    const result = await sellerCustomer_schema_1.default.findOneAndUpdate({
        _id: sellerCustomerId,
    }, {
        $set: {
            isActive,
        },
    }, { returnDocument: "after", runValidators: true });
    if (!result) {
        throw new appError_1.AppError("Seller customer not found", 404);
    }
    return result;
};
exports.updateStatus = updateStatus;
//# sourceMappingURL=sellerCustomer.service.js.map