import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionCustomerId } from "@/lib/auth/session";
import { getPresignedDownloadUrl } from "@/lib/storage/r2";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ purchaseId: string }> }
) {
  const customerId = await getSessionCustomerId();
  if (!customerId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { purchaseId } = await params;
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: { product: true },
  });

  // Same 404 for "doesn't exist" and "not yours" — no ownership enumeration.
  if (!purchase || purchase.customerId !== customerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!purchase.product.r2Bucket || !purchase.product.r2Key) {
    logger.error("Product file not provisioned", { productId: purchase.productId });
    return NextResponse.json(
      { error: "This product isn't ready for download yet. Please contact support." },
      { status: 503 }
    );
  }

  try {
    const url = await getPresignedDownloadUrl(purchase.product.r2Bucket, purchase.product.r2Key);
    return NextResponse.redirect(url);
  } catch (err) {
    logger.error("Failed to generate download URL", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Unable to generate download link" }, { status: 502 });
  }
}
