"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomer = exports.getCustomerList = void 0;
const appError_1 = require("../../middlewares/appError");
const customer_schema_1 = __importDefault(require("./customer.schema"));
const useSkip_1 = require("../../utils/useSkip");
const sellerCustomer_schema_1 = __importDefault(require("../sellerCustomer/sellerCustomer.schema"));
const LIST_FIELDS = "customerId name phone source totalOrders totalPurchased totalPaid due credit tags lastPurchasedAt isActive createdAt ";
const getCustomerList = async (query) => {
    const { page, limit, sortBy, sortOrder, isActive, search, phone } = query;
    const filter = {
        isActive: isActive ?? true,
    };
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
        ];
    }
    // if(phone){
    //   filter.phone =  { $regex: phone, $options: "i" } }
    // }
    const [customers, total] = await Promise.all([
        customer_schema_1.default.find(filter)
            .skip((0, useSkip_1.useSkip)({ page, limit }))
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .lean(),
        customer_schema_1.default.countDocuments(filter),
    ]);
    return { customers, total, page, limit };
};
exports.getCustomerList = getCustomerList;
const createCustomer = async (sellerId, input) => {
    const { name, phone } = input;
    const customer = await customer_schema_1.default.findOneAndUpdate({ phone }, { $setOnInsert: { name, phone } }, { upsert: true, returnDocument: "after" });
    if (!customer)
        throw new appError_1.AppError("Failed to create Customer", 500);
    if (!customer.isActive)
        throw new appError_1.AppError("This customer cannot be added", 403);
    try {
        const link = await sellerCustomer_schema_1.default.create({
            sellerId,
            customerId: customer._id,
            name,
            phone,
            source: "pos",
        });
        return {
            _id: link._id,
            customerId: link.customerId,
            name: link.name,
            phone: link.phone,
            source: link.source,
            totalOrders: 0,
            totalPurchased: 0,
            totalPaid: 0,
            due: 0,
            credit: 0,
            tags: [],
            lastPurchasedAt: null,
        };
    }
    catch (error) {
        if (error.code === 11000) {
            throw new appError_1.AppError("This customer already exist", 409);
        }
        throw error;
    }
};
exports.createCustomer = createCustomer;
//# sourceMappingURL=customer.service.js.map