"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./config/db"));
let isConnected = false;
const ensureDBConnection = async () => {
    if (isConnected)
        return;
    await (0, db_1.default)();
    isConnected = true;
};
// Vercel sets VERCEL=1 and uses the exported handler.
// Everywhere else (local, Render) we run a normal server.
if (!process.env.VERCEL) {
    const PORT = Number(process.env.PORT) || 5000;
    ensureDBConnection()
        .then(() => {
        app_1.default.listen(PORT, () => {
            console.log(`[Server] Running on port ${PORT}`);
        });
    })
        .catch((err) => {
        console.error("[Server] Startup failed:", err);
        process.exit(1);
    });
}
async function handler(req, res) {
    try {
        await ensureDBConnection();
        return (0, app_1.default)(req, res);
    }
    catch (err) {
        console.error("[Handler] Error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}
//# sourceMappingURL=index.js.map