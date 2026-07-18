import crypto from "crypto";

export function isValidBearerToken(authHeader: string | null, expected: string): boolean {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const provided = authHeader.slice("Bearer ".length);

  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  if (expectedBuf.length !== providedBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}
