"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomer = exports.getCustomerList = void 0;
const appError_1 = require("../../middlewares/appError");
const customer_schema_1 = __importDefault(require("./customer.schema"));
const useSkip_1 = require("../../utils/useSkip");
const getCustomerList = async (query, sellerId) => {
    const { page, limit, sort_by, sort_order, is_active, search, phone } = query;
    const filter = {
        sellerId,
        isActive: true,
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
            .sort({ [sort_by]: sort_order })
            .lean(),
        customer_schema_1.default.countDocuments(filter),
    ]);
    return { customers, total, page, limit };
};
exports.getCustomerList = getCustomerList;
const createCustomer = async (input) => {
    const { name, email } = input;
    const existing = await customer_schema_1.default.findOne({ email }).lean();
    if (existing)
        throw new appError_1.AppError("This customer already exist", 409);
    const newCustomer = await customer_schema_1.default.create({ name, email });
    if (!newCustomer)
        throw new appError_1.AppError("Failed to create customer", 500);
    return newCustomer;
};
exports.createCustomer = createCustomer;
//# sourceMappingURL=customer.service.js.map