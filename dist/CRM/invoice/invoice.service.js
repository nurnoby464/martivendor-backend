"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getByOrderId = void 0;
const appError_1 = require("../../middlewares/appError");
const invoice_schema_1 = __importDefault(require("./invoice.schema"));
const getByOrderId = async (orderId) => {
    if (!orderId)
        throw new appError_1.AppError("orderId is required", 400);
    const invoice = await invoice_schema_1.default.findOne({ order: orderId }).populate("company order customer items.product items.variant");
    if (!invoice)
        throw new appError_1.AppError("Invoice not found for the given orderId", 404);
    return invoice;
};
exports.getByOrderId = getByOrderId;
//# sourceMappingURL=invoice.service.js.map