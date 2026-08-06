"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtHelper = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload.data, payload.secret, {
        algorithm: "HS256",
        expiresIn: payload.expiresIn,
    });
};
const verifyToken = (payload) => {
    return jsonwebtoken_1.default.verify(payload.token, payload.secret);
};
exports.JwtHelper = {
    generateToken,
    verifyToken,
};
//# sourceMappingURL=jwtHelper.js.map