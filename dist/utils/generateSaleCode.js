"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSaleCode = void 0;
const sales_schema_1 = __importDefault(require("../CRM/sales/sales.schema"));
const generateSaleCode = async (companyId) => {
    const today = new Date();
    const datePart = today.toISOString().slice(0, 10).replace(/-/g, "");
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOFDay = new Date(today.setHours(23, 59, 59, 999));
    const count = await sales_schema_1.default.countDocuments({
        companyId,
        createdAt: { $gt: startOfDay, $lt: endOFDay },
    });
    const sequence = String(count + 1).padStart(5, "0");
    return `SL-${datePart}-${sequence}`;
};
exports.generateSaleCode = generateSaleCode;
//# sourceMappingURL=generateSaleCode.js.map