import { NextRequest, NextResponse } from "next/server";
import { ingestPurchaseSchema } from "@/lib/validation/ingest";
import { isValidBearerToken } from "@/lib/auth/apiKey";
import {
  upsertCustomer,
  upsertProductStub,
  createPurchaseIdempotent,
} from "@/lib/purchases/purchaseService";
import { issueMagicLinkToken } from "@/lib/auth/magicLink";
import { sendMagicLinkEmail } from "@/lib/email/sendMagicLink";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

// Server-to-server only — TIC-v2 (or any storefront) calls this after its
// own webhook confirms payment. Must be safe to call repeatedly for the same
// orderId since the caller's retry queue will keep hitting it until it 200s.
export async function POST(req: NextRequest) {
  const apiKey = process.env.PLATFORM_INGEST_API_KEY;
  if (!apiKey) {
    logger.error("PLATFORM_INGEST_API_KEY is not configured");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  if (!isValidBearerToken(req.headers.get("authorization"), apiKey)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ingestPurchaseSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { customer, order, payment, product } = parsed.data;

  try {
    const customerRecord = await upsertCustomer(customer.email, customer.name);
    await upsertProductStub(product.id, product.name);

    const { purchase, created } = await createPurchaseIdempotent({
      orderId: order.orderId,
      customerId: customerRecord.id,
      productId: product.id,
      amount: order.amount,
      currency: order.currency,
      cfPaymentId: payment.cfPaymentId ?? null,
      sourcePlatform: "TIC-v2",
    });

    if (created) {
      const baseUrl = process.env.APP_BASE_URL;
      if (!baseUrl) {
        logger.error("APP_BASE_URL is not configured");
      } else {
        const rawToken = await issueMagicLinkToken(customer.email);
        const magicLinkUrl = `${baseUrl}/api/auth/magic-link/verify?token=${rawToken}`;
        await sendMagicLinkEmail(customer.email, magicLinkUrl);
      }
      logger.info("Purchase ingested", { orderId: order.orderId, productId: product.id });
    } else {
      logger.info("Duplicate purchase ingest ignored", { orderId: order.orderId });
    }

    return NextResponse.json({ received: true, purchaseId: purchase.id });
  } catch (err) {
    logger.error("Failed to ingest purchase", {
      error: err instanceof Error ? err.message : String(err),
      orderId: order.orderId,
    });
    return NextResponse.json({ error: "Unable to process purchase" }, { status: 502 });
  }
}
