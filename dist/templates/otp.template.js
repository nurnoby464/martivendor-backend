"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpTemplate = void 0;
const otpTemplate = (name, otp) => `
<div style="font-family: Arial, sans-serif;">
    <h2>Hello ${name},</h2>

    <p>Your verification code is:</p>

    <h1 style="letter-spacing:5px;">${otp}</h1>

    <p>This OTP will expire in 2 minutes.</p>

    <p>If you didn't request this, please ignore this email.</p>
</div>
`;
exports.otpTemplate = otpTemplate;
//# sourceMappingURL=otp.template.js.map