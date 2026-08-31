interface EmailPayload {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
export declare const sendEmail: (payload: EmailPayload) => Promise<any>;
export {};
//# sourceMappingURL=email.services.d.ts.map