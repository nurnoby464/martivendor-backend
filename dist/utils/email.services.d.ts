interface EmailPayload {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
export declare const sendEmail: (payload: EmailPayload) => Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
export {};
//# sourceMappingURL=email.services.d.ts.map