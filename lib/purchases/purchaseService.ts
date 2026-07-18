import { Prisma, type Purchase } from "@prisma/client";
import { prisma } from "@/lib/db";

export function upsertCustomer(email: string, name: string) {
  return prisma.customer.upsert({
    where: { email },
    update: { name },
    create: { email, name },
  });
}

// Creates a minimal Product row if this productId hasn't been seen before.
// Never overwrites an existing product's name/r2Key — those are owned by the
// seed/admin step that wires up the actual file.
export function upsertProductStub(id: string, name: string) {
  return prisma.product.upsert({
    where: { id },
    update: {},
    create: { id, name },
  });
}

export async function createPurchaseIdempotent(input: {
  orderId: string;
  customerId: string;
  productId: string;
  amount: number;
  currency: string;
  cfPaymentId: string | null;
  sourcePlatform: string;
}): Promise<{ purchase: Purchase; created: boolean }> {
  try {
    const purchase = await prisma.purchase.create({
      data: {
        orderId: input.orderId,
        customerId: input.customerId,
        productId: input.productId,
        amount: input.amount,
        currency: input.currency,
        cfPaymentId: input.cfPaymentId,
        sourcePlatform: input.sourcePlatform,
      },
    });
    return { purchase, created: true };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const existing = await prisma.purchase.findUniqueOrThrow({
        where: { orderId: input.orderId },
      });
      return { purchase: existing, created: false };
    }
    throw err;
  }
}

export function listPurchasesForCustomer(customerId: string) {
  return prisma.purchase.findMany({
    where: { customerId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
}
