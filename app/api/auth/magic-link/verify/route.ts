import { NextRequest, NextResponse } from "next/server";
import { consumeMagicLinkToken } from "@/lib/auth/magicLink";
import { setSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const baseUrl = req.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/login?error=missing_token`);
  }

  const email = await consumeMagicLinkToken(token);
  if (!email) {
    return NextResponse.redirect(`${baseUrl}/login?error=invalid_or_expired`);
  }

  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer) {
    return NextResponse.redirect(`${baseUrl}/login?error=no_account`);
  }

  await setSessionCookie(customer.id);
  return NextResponse.redirect(`${baseUrl}/portal`);
}
