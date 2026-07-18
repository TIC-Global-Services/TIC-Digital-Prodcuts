import { Resend } from "resend";
import { logger } from "@/lib/logger";

export async function sendMagicLinkEmail(email: string, magicLinkUrl: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    logger.warn("Email sending not configured — logging magic link instead", {
      email,
      magicLinkUrl,
    });
    return;
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "Access your purchase",
    html: `
      <p>Click the link below to view and download your purchase:</p>
      <p><a href="${magicLinkUrl}">${magicLinkUrl}</a></p>
      <p>This link expires in 15 minutes and can only be used once.</p>
    `,
  });

  if (error) {
    logger.error("Failed to send magic link email", { email, error: error.message });
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
