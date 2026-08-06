"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtConfig = void 0;
const requireEnv = (key) => {
    const value = process.env[key];
    if (!value)
        throw new Error(`Missing required env variable: ${key}`);
    return value;
};
exports.jwtConfig = {
    access: {
        secret: requireEnv("JWT_SECRET"),
        expiresIn: requireEnv("JWT_EXPIRES_IN"),
    },
    refresh: {
        secret: requireEnv("JWT_REFRESH_SECRET"),
        expiresIn: requireEnv("JWT_REFRESH_EXPIRES_IN"),
    },
};
//# sourceMappingURL=jwt.config.js.map