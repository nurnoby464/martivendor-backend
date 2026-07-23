"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDiscount = exports.generateInvoiceNumber = exports.generateOderNumber = void 0;
const order_schema_1 = __importDefault(require("../CRM/order/order.schema"));
const generateOderNumber = async (sellerId) => {
    const count = await order_schema_1.default.countDocuments({ sellerId });
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const date = String(new Date().getDate()).padStart(2, "0");
    const orderNum = String(count + 1).padStart(5, "0");
    return `ORD-${year}${month}${date}${orderNum}`;
};
exports.generateOderNumber = generateOderNumber;
const generateInvoiceNumber = async () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const date = String(new Date().getDate()).padStart(2, "0");
    const orderNum = String(Math.floor(Math.random() * 100000)).padStart(5, "0");
    return `INV-${year}${month}${date}${orderNum}`;
};
exports.generateInvoiceNumber = generateInvoiceNumber;
const calculateDiscount = (data) => {
    const { sellingPrice, quantity, discountType, discountValue } = data;
    if (!discountType || !discountValue)
        return 0;
    if (discountType === "flat")
        return discountValue * quantity;
    return Math.round((sellingPrice * discountValue) / 100) * quantity;
};
exports.calculateDiscount = calculateDiscount;
//# sourceMappingURL=healper.js.map