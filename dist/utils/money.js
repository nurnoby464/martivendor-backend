"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isClose = exports.round2 = void 0;
// utils/money.ts
const round2 = (n) => Math.round(n * 100) / 100;
exports.round2 = round2;
// floating point safe comparison (৳0.01 tolerance)
const isClose = (a, b, tolerance = 0.01) => Math.abs(a - b) <= tolerance;
exports.isClose = isClose;
//# sourceMappingURL=money.js.map