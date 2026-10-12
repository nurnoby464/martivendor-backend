"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextSequence = exports.Counter = void 0;
const mongoose_1 = require("mongoose");
const CounterSchema = new mongoose_1.Schema({
    key: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
}, { collection: "counters" });
exports.Counter = (0, mongoose_1.model)("Counter", CounterSchema);
const nextSequence = async (key) => {
    const doc = await exports.Counter.findOneAndUpdate({ key }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" });
    if (!doc)
        throw new Error(`Failed to generate sequence for ${key}`);
    return doc.seq;
};
exports.nextSequence = nextSequence;
//# sourceMappingURL=counter.js.map