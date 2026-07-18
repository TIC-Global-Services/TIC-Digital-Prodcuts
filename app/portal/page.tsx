import Image from "next/image";
import { redirect } from "next/navigation";
import { getSessionCustomerId } from "@/lib/auth/session";
import { listPurchasesForCustomer } from "@/lib/purchases/purchaseService";
import { getProductCoverImage } from "@/lib/products/coverImages";

export default async function PortalPage() {
  const customerId = await getSessionCustomerId();
  if (!customerId) {
    redirect("/login");
  }

  const purchases = await listPurchasesForCustomer(customerId);

  return (
    <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-[var(--font-aeonik)] text-2xl sm:text-3xl leading-tight tracking-tight">
          Your purchases
        </h1>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="text-xs text-black/50 hover:text-black transition-colors tracking-wide uppercase"
          >
            Log out
          </button>
        </form>
      </div>

      {purchases.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/5 px-6 py-10 text-center">
          <p className="text-sm text-black/60">You don&apos;t have any purchases yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {purchases.map((purchase) => {
            const cover = getProductCoverImage(purchase.productId);
            return (
              <li
                key={purchase.id}
                className="flex items-center justify-between gap-4 bg-white border border-black/5 rounded-2xl px-5 py-4 sm:px-6 sm:py-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {cover && (
                    <div className="shrink-0 w-12 h-16 sm:w-14 sm:h-[76px] rounded-md overflow-hidden shadow-[0_6px_16px_rgba(0,0,0,0.1)]">
                      <Image
                        src={cover}
                        alt={purchase.product.name}
                        width={112}
                        height={152}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{purchase.product.name}</p>
                    <p className="text-xs text-black/50 mt-1">
                      Purchased {purchase.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <a
                  href={`/api/downloads/${purchase.id}`}
                  target="_blank"
                  className="shrink-0 inline-flex items-center gap-2 bg-[#1a1a1a] hover:bg-black text-white text-xs sm:text-sm font-medium px-4 sm:px-5 py-2 sm:py-2.5 rounded-full transition-all duration-300 border border-white/10 hover:border-white/20"
                >
                  Download
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
