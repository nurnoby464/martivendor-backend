"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSubOrderMoney = exports.calculateShipping = void 0;
const money_1 = require("./money");
const order_constant_1 = require("./order.constant");
const SHIPPING_CHARGE_INSIDE_DHAKA = 60;
const SHIPPING_CHARGE_OUTSIDE_DHAKA = 90;
// Swap this for the real inside/outside logic later
const PER_SELLER_SHIPPING = SHIPPING_CHARGE_INSIDE_DHAKA;
const calculateShipping = (_seller) => SHIPPING_CHARGE_INSIDE_DHAKA;
exports.calculateShipping = calculateShipping;
order_constant_1.SHIPPING_FEE;
const calculateSubOrderMoney = (lines, seller) => {
    const subtotal = (0, money_1.round2)(lines.reduce((sum, curr) => sum + curr.totalPrice, 0));
    const discountAmount = (0, money_1.round2)(lines.reduce((sum, curr) => sum + curr.discountAmount, 0));
    const taxAmount = 0;
    const shippingCharge = (0, exports.calculateShipping)(seller);
    const total = (0, money_1.round2)(subtotal + taxAmount + shippingCharge);
    const commissionRate = seller.isPlatform ? 0 : seller.commissionRate;
    const commissionAmount = (0, money_1.round2)((subtotal * commissionRate) / 100);
    const sellerEarning = (0, money_1.round2)(total - commissionAmount);
    return {
        subtotal,
        discountAmount,
        taxAmount,
        shippingCharge,
        total,
        commissionAmount,
        commissionRate,
        sellerEarning,
    };
};
exports.calculateSubOrderMoney = calculateSubOrderMoney;
//# sourceMappingURL=order.pricing.js.map