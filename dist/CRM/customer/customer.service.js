"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerList = void 0;
const customer_schema_1 = __importDefault(require("./customer.schema"));
const useSkip_1 = require("../../utils/useSkip");
const getCustomerList = async (query, companyId) => {
    const { page, limit, sort_by, sort_order, is_active, search } = query;
    const filter = {
        companyId,
        isActive: true,
    };
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
        ];
    }
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
//# sourceMappingURL=customer.service.js.map