"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveOrderStatus = exports.generateSubOrderNumber = exports.generateOrderNumber = void 0;
const counter_1 = require("./counter");
const generateOrderNumber = async () => {
    const day = new Date()
        .toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" }) // 2026-10-07
        .replace(/-/g, "");
    const seq = await (0, counter_1.nextSequence)(`order:${day}`);
    return `ORD-${day}-${String(seq).padStart(5, "0")}`;
};
exports.generateOrderNumber = generateOrderNumber;
// ORD-20261007-00001-1, -2, -3 ...
const generateSubOrderNumber = (orderNumber, index) => `${orderNumber}-${index}`;
exports.generateSubOrderNumber = generateSubOrderNumber;
const deriveOrderStatus = (subOrders) => {
    const active = subOrders.filter((s) => s.status !== "cancelled");
    if (active.length === 0)
        return "cancelled";
    const all = (st) => active.every((s) => s.status === st);
    const some = (st) => active.some((s) => s.status === st);
    if (all("returned"))
        return "returned";
    if (all("delivered"))
        return "delivered";
    if (all("shipped"))
        return "shipped";
    if (all("pending"))
        return "pending";
    if (some("delivered"))
        return "partially_delivered";
    if (some("shipped"))
        return "partially_shipped";
    return "processing";
};
exports.deriveOrderStatus = deriveOrderStatus;
//# sourceMappingURL=orderHelper.js.map