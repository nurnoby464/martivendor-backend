import { EventEmitter } from "events";

export const eventEmitter = new EventEmitter();

// Increase max listeners (default is 10)
// as we'll have multiple listeners per event
eventEmitter.setMaxListeners(20);

// Handle uncaught errors in listeners
eventEmitter.on("error", (error) => {
  console.error("❌ EventEmitter Error:", error);
});

console.log("✅ EventEmitter initialized");