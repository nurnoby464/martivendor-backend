"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfileType = exports.STAFF_ROLES = void 0;
// utils/roleHelper.ts
exports.STAFF_ROLES = [
    "admin", "account", "site_management",
    "inventory", "sales", "report",
];
const getProfileType = (role) => {
    if (role === "customer")
        return "Customer";
    if (exports.STAFF_ROLES.includes(role))
        return "Staff";
    return null; // super_admin
};
exports.getProfileType = getProfileType;
//# sourceMappingURL=roleHelper.js.map