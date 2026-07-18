import crypto from "crypto";
import { prisma } from "@/lib/db";

const TOKEN_TTL_MS = 15 * 60 * 1000;

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function issueMagicLinkToken(email: string): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString("hex");

  await prisma.magicLinkToken.create({
    data: {
      email,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  return rawToken;
}

export async function consumeMagicLinkToken(rawToken: string): Promise<string | null> {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.magicLinkToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return null;
  }

  await prisma.magicLinkToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return record.email;
}
