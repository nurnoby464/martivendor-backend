"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const customer_interface_1 = require("./customer.interface");
const addressSchema = new mongoose_1.Schema({
    label: { type: String, required: true, default: "home" },
    district: { type: String, required: true },
    area: { type: String, required: true },
    zip: { type: String, default: null },
    isDefault: { type: Boolean, default: false },
});
const customerSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    image: { type: String, default: null },
    dob: { type: Date, default: null },
    gender: {
        type: String,
        enum: customer_interface_1.CUSTOMER_GENDERS,
        default: null,
    },
    addresses: { type: [addressSchema], default: [] },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
});
// One person = one Customer, platform-wide.
customerSchema.index({ phone: 1 }, { unique: true });
customerSchema.index({ email: 1 }, {
    unique: true,
    partialFilterExpression: {
        email: { $type: "string" },
    },
});
customerSchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { userId: { $type: "objectId" } } });
const Customer = (0, mongoose_1.model)("Customer", customerSchema);
exports.default = Customer;
//# sourceMappingURL=customer.schema.js.map