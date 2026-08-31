"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventEmitter = void 0;
const events_1 = require("events");
exports.eventEmitter = new events_1.EventEmitter();
// Increase max listeners (default is 10)
// as we'll have multiple listeners per event
exports.eventEmitter.setMaxListeners(20);
// Handle uncaught errors in listeners
exports.eventEmitter.on("error", (error) => {
    console.error("❌ EventEmitter Error:", error);
});
console.log("✅ EventEmitter initialized");
//# sourceMappingURL=emitter.js.map