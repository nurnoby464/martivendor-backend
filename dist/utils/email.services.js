"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const mail_1 = require("../config/mail");
const sendEmail = async (payload) => {
    return mail_1.transporter.sendMail({
        from: process.env.SMTP_FROM,
        ...payload,
    });
};
exports.sendEmail = sendEmail;
//# sourceMappingURL=email.services.js.map