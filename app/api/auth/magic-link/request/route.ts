import { NextRequest, NextResponse } from "next/server";
import { magicLinkRequestSchema } from "@/lib/validation/auth";
import { isRateLimited } from "@/lib/rateLimit";
import { prisma } from "@/lib/db";
import { issueMagicLinkToken } from "@/lib/auth/magicLink";
import { sendLoginLinkEmail } from "@/lib/email/sendMagicLink";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = magicLinkRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { email } = parsed.data;

  try {
    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) {
      return NextResponse.json({ exists: false, message: "No account found for that email." });
    }

    const baseUrl = process.env.APP_BASE_URL;
    if (baseUrl) {
      const rawToken = await issueMagicLinkToken(email);
      const magicLinkUrl = `${baseUrl}/api/auth/magic-link/verify?token=${rawToken}`;
      await sendLoginLinkEmail({ email, customerName: customer.name, magicLinkUrl });
    }

    return NextResponse.json({ exists: true, message: "Login link sent — check your inbox." });
  } catch (err) {
    logger.error("Magic link request failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
