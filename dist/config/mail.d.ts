import { Transporter } from "nodemailer";
export declare const transporter: Transporter;
interface EmailPayload {
    to: string;
    subject: string;
    html: string;
    text?: string;
    cc?: string[];
    bcc?: string[];
}
interface EmailResponse {
    success: boolean;
    messageId?: string;
    error?: string;
}
/**
 * Send email with proper error handling & logging
 * Returns success/failure instead of throwing
 */
export declare const sendEmail: (payload: EmailPayload) => Promise<EmailResponse>;
export {};
//# sourceMappingURL=mail.d.ts.map