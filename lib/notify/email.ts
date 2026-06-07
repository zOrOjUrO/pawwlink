import type { Notifier } from "@/lib/notify/mock";
import nodemailer from "nodemailer";

const smtpHost = process.env.EMAIL_SMTP_HOST;
const smtpPort = Number(process.env.EMAIL_SMTP_PORT ?? "587");
const smtpUser = process.env.EMAIL_SMTP_USER;
const smtpPass = process.env.EMAIL_SMTP_PASS;
const fromAddress = process.env.EMAIL_FROM_ADDRESS;

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function validateEmailConfig(): void {
  if (!smtpHost || !smtpUser || !smtpPass || !fromAddress) {
    throw new Error(
      "Email notifier requires EMAIL_SMTP_HOST, EMAIL_SMTP_USER, EMAIL_SMTP_PASS, and EMAIL_FROM_ADDRESS environment variables."
    );
  }
}

function getTransporter() {
  if (!transporter) {
    validateEmailConfig();
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }
  return transporter;
}

export const emailNotifier: Notifier = {
  name: "email",

  async sendSms(to: string, message: string): Promise<boolean> {
    console.warn(
      "[EmailNotifier] sendSms is not supported by the email provider. Use sendEmail instead."
    );
    return false;
  },

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    try {
      const transport = getTransporter();
      const info = await transport.sendMail({
        from: fromAddress,
        to,
        subject,
        text: body,
      });

      console.info(
        `[EmailNotifier] sendEmail to ${to} success messageId=${info.messageId}`
      );
      return Boolean(info.messageId);
    } catch (error) {
      console.error(`[EmailNotifier] sendEmail failed to ${to}:`, error);
      return false;
    }
  },
};
