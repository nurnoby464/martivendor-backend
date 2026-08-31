"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = exports.transporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
exports.transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // true if using port 465
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    }
});
// ─── Send Email Function ─────────────────────────────────────────────────────
/**
 * Send email with proper error handling & logging
 * Returns success/failure instead of throwing
 */
const sendEmail = async (payload) => {
    try {
        // Validate required fields
        if (!payload.to || !payload.subject || !payload.html) {
            console.error("❌ Invalid email payload - missing required fields:", {
                to: payload.to,
                subject: payload.subject,
                html: payload.html ? "provided" : "missing",
            });
            return {
                success: false,
                error: "Missing required fields: to, subject, html",
            };
        }
        // Validate SMTP configuration
        if (!process.env.SMTP_FROM) {
            console.error("❌ SMTP_FROM not configured in .env");
            return {
                success: false,
                error: "Email sender (SMTP_FROM) not configured",
            };
        }
        // Send email
        const info = await exports.transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
            text: payload.text,
            cc: payload.cc,
            bcc: payload.bcc,
        });
        console.log(`✅ Email sent | To: ${payload.to} | Subject: ${payload.subject} | MessageID: ${info.messageId}`);
        return {
            success: true,
            messageId: info.messageId,
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`❌ Failed to send email to ${payload.to}:`, errorMessage);
        return {
            success: false,
            error: errorMessage,
        };
    }
};
exports.sendEmail = sendEmail;
//# sourceMappingURL=mail.js.map