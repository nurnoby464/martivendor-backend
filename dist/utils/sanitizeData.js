"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeData = void 0;
const sanitizeData = (payload) => {
    return Object.fromEntries(Object.entries(payload).filter(([_, value]) => value !== undefined &&
        value !== null &&
        !(typeof value === "string" && value.trim() === "")));
};
exports.sanitizeData = sanitizeData;
//# sourceMappingURL=sanitizeData.js.map