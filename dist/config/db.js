"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const cache = global._mongoCache ?? {
    conn: null,
    promise: null,
};
global._mongoCache = cache;
const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error('[DB] MONGO_URI is not defined');
    }
    // ✅ Ensure active connection
    if (cache.conn && mongoose_1.default.connection.readyState === 1) {
        return cache.conn;
    }
    if (!cache.promise) {
        cache.promise = mongoose_1.default
            .connect(process.env.MONGO_URI, {
            bufferCommands: false,
        })
            .then((mongooseInstance) => {
            if (process.env.NODE_ENV === 'development') {
                console.log(`[DB] Connected: ${mongooseInstance.connection.host}`);
            }
            return mongooseInstance.connection;
        });
    }
    try {
        cache.conn = await cache.promise;
    }
    catch (err) {
        cache.promise = null;
        throw err;
    }
    return cache.conn;
};
exports.default = connectDB;
//# sourceMappingURL=db.js.map