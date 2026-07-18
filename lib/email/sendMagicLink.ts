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

const BRAND_NAME = "The Internet Company";

function emailShell(params: { preheader: string; bodyHtml: string; ctaLabel: string; ctaUrl: string }): string {
  const { preheader, bodyHtml, ctaLabel, ctaUrl } = params;
  return `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#F4F3EA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <span style="display:none; font-size:1px; color:#F4F3EA; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
      ${preheader}
    </span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F3EA; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#ffffff; border-radius:16px; overflow:hidden;">
            <tr>
              <td style="padding: 32px 32px 8px 32px;">
                <p style="margin:0; font-size:13px; letter-spacing:0.08em; text-transform:uppercase; color:#1a1a1a99;">
                  ${BRAND_NAME}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 32px 24px 32px; color:#1a1a1a; font-size:15px; line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding: 0 32px 32px 32px;">
                <a href="${ctaUrl}"
                   style="display:inline-block; background-color:#1a1a1a; color:#ffffff; text-decoration:none; font-size:14px; font-weight:500; padding:12px 24px; border-radius:999px;">
                  ${ctaLabel}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 32px 32px 32px; border-top: 1px solid #1a1a1a14; padding-top: 20px;">
                <p style="margin:0; font-size:12px; color:#1a1a1a80; line-height:1.6;">
                  This link expires in 15 minutes and can only be used once. If the button doesn't work, copy and paste this URL into your browser:<br />
                  <a href="${ctaUrl}" style="color:#1a1a1a99; word-break:break-all;">${ctaUrl}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function dispatch(params: { email: string; subject: string; html: string; text: string }): Promise<void> {
  const from = process.env.EMAIL_FROM;
  const smtp = getTransporter();

  if (!smtp || !from) {
    logger.warn("Email sending not configured — logging email instead", {
      email: params.email,
      subject: params.subject,
    });
    return;
  }

  try {
    await smtp.sendMail({
      from: `${BRAND_NAME} <${from}>`,
      to: params.email,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown SMTP error";
    logger.error("Failed to send email", { email: params.email, subject: params.subject, error: message });
    throw new Error(`Failed to send email: ${message}`);
  }
}

/**
 * Sent right after a purchase is recorded — first-time access to the portal.
 */
export async function sendPurchaseConfirmationEmail(params: {
  email: string;
  customerName: string;
  productName: string;
  magicLinkUrl: string;
}): Promise<void> {
  const { email, customerName, productName, magicLinkUrl } = params;
  const firstName = customerName.trim().split(" ")[0] || "there";

  const bodyHtml = `
    <p style="margin:0 0 16px 0; font-size:20px; font-weight:500; color:#1a1a1a;">Thanks for your purchase, ${firstName}.</p>
    <p style="margin:0 0 16px 0;">Your copy of <strong>${productName}</strong> is ready. Use the button below to open your account and download it — no password needed.</p>
  `;

  await dispatch({
    email,
    subject: `Your copy of "${productName}" is ready`,
    html: emailShell({
      preheader: `Your copy of ${productName} is ready to download.`,
      bodyHtml,
      ctaLabel: "Access your purchase",
      ctaUrl: magicLinkUrl,
    }),
    text: `Thanks for your purchase, ${firstName}.\n\nYour copy of ${productName} is ready. Open this link to access and download it (expires in 15 minutes, single use):\n${magicLinkUrl}`,
  });
}

/**
 * Sent when a returning customer requests a fresh login link from /login.
 */
export async function sendLoginLinkEmail(params: {
  email: string;
  customerName?: string;
  magicLinkUrl: string;
}): Promise<void> {
  const { email, customerName, magicLinkUrl } = params;
  const greeting = customerName?.trim().split(" ")[0];

  const bodyHtml = `
    <p style="margin:0 0 16px 0; font-size:20px; font-weight:500; color:#1a1a1a;">${greeting ? `Hey ${greeting},` : "Hey there,"}</p>
    <p style="margin:0 0 16px 0;">Here's your login link to access your purchases. Click the button below to continue — no password needed.</p>
  `;

  await dispatch({
    email,
    subject: `Your login link — ${BRAND_NAME}`,
    html: emailShell({
      preheader: "Here's your login link to access your purchases.",
      bodyHtml,
      ctaLabel: "Log in",
      ctaUrl: magicLinkUrl,
    }),
    text: `${greeting ? `Hey ${greeting},` : "Hey there,"}\n\nHere's your login link to access your purchases (expires in 15 minutes, single use):\n${magicLinkUrl}`,
  });
}
