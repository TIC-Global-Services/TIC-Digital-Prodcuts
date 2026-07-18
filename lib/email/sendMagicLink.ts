import nodemailer from "nodemailer";
import { logger } from "@/lib/logger";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465 (implicit TLS), false for 587/25 (STARTTLS)
    auth: { user, pass },
  });

  return transporter;
}

export async function sendMagicLinkEmail(email: string, magicLinkUrl: string): Promise<void> {
  const from = process.env.EMAIL_FROM;
  const smtp = getTransporter();

  if (!smtp || !from) {
    logger.warn("Email sending not configured — logging magic link instead", {
      email,
      magicLinkUrl,
    });
    return;
  }

  try {
    await smtp.sendMail({
      from,
      to: email,
      subject: "Access your purchase",
      html: `
        <p>Click the link below to view and download your purchase:</p>
        <p><a href="${magicLinkUrl}">${magicLinkUrl}</a></p>
        <p>This link expires in 15 minutes and can only be used once.</p>
      `,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown SMTP error";
    logger.error("Failed to send magic link email", { email, error: message });
    throw new Error(`Failed to send email: ${message}`);
  }
}
