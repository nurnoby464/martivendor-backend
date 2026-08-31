"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventEmitter = void 0;
exports.initializeEventListeners = initializeEventListeners;
const emitter_1 = require("./emitter");
Object.defineProperty(exports, "eventEmitter", { enumerable: true, get: function () { return emitter_1.eventEmitter; } });
const orderListeners_1 = require("./listeners/orderListeners");
const constants_1 = require("../notifications/constants");
/**
 * Register all event listeners
 * Call this once when app starts (in app.ts)
 */
function initializeEventListeners() {
    console.log("\n🚀 Initializing event listeners...");
    // Order events
    emitter_1.eventEmitter.on(constants_1.NOTIFICATION_TYPES.ORDER.CREATED, orderListeners_1.handleOrderCreated);
    // Add more listeners here as you expand
    // eventEmitter.on(NOTIFICATION_TYPES.PAYMENT.SUCCESS, handlePaymentSuccess);
    // eventEmitter.on(NOTIFICATION_TYPES.INVENTORY.LOW_STOCK, handleLowStock);
    console.log("✅ Event listeners initialized\n");
}
//# sourceMappingURL=index.js.map