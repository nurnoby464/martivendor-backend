"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerList = void 0;
const staff_schema_1 = __importDefault(require("./staff.schema"));
const useSkip_1 = require("../../utils/useSkip");
const getCustomerList = async (query, companyId) => {
    const { page, limit, sort_by, sort_order, is_active } = query;
    const filter = {
        companyId,
        isActive: true,
    };
    const [customers, total] = await Promise.all([
        staff_schema_1.default.find(filter)
            .skip((0, useSkip_1.useSkip)({ page, limit }))
            .limit(limit)
            .sort({ [sort_by]: sort_order })
            .lean(),
        staff_schema_1.default.countDocuments(filter),
    ]);
    return { customers, total };
};
exports.getCustomerList = getCustomerList;
//# sourceMappingURL=staff.service.js.map