interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
export declare const sendEmail: ({ to, subject, html, text, }: SendEmailOptions) => Promise<void>;
export {};
//# sourceMappingURL=sendEmail.d.ts.map