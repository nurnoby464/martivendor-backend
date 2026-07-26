import { transporter } from "../config/mail";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (payload: EmailPayload) => {
  return transporter.sendMail({
    from: process.env.SMTP_FROM,
    ...payload,
  });
};