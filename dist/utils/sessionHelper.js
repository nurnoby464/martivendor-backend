"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enforceSessionLimit = void 0;
const auth_schema_1 = __importDefault(require("../module/auth/auth.schema"));
const MAX_SESSIONS = 5;
const enforceSessionLimit = async (userId) => {
    //   const count = await Session.countDocuments({ userId, valid: true });
    //   console.log(count);
    const sessions = await auth_schema_1.default.find({ userId, valid: true })
        .sort({ updatedAt: 1 }) // oldest first
        .select("_id");
    if (MAX_SESSIONS < sessions.length) {
        const toDelete = sessions.slice(0, sessions.length - 1).map((s) => s._id);
        await auth_schema_1.default.deleteMany({ _id: { $in: toDelete } });
    }
    console.log(sessions);
};
exports.enforceSessionLimit = enforceSessionLimit;
//# sourceMappingURL=sessionHelper.js.map