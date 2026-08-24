import { eventEmitter } from "./emitter";
import { handleOrderCreated } from "./listeners/orderListeners";
import { NOTIFICATION_TYPES } from "../notifications/constants";

/**
 * Register all event listeners
 * Call this once when app starts (in app.ts)
 */
export function initializeEventListeners() {
  console.log("\n🚀 Initializing event listeners...");

  // Order events
  eventEmitter.on(NOTIFICATION_TYPES.ORDER.CREATED, handleOrderCreated);

  // Add more listeners here as you expand
  // eventEmitter.on(NOTIFICATION_TYPES.PAYMENT.SUCCESS, handlePaymentSuccess);
  // eventEmitter.on(NOTIFICATION_TYPES.INVENTORY.LOW_STOCK, handleLowStock);

  console.log("✅ Event listeners initialized\n");
}

export { eventEmitter };