import { redirect } from "next/navigation";
import { getSessionCustomerId } from "@/lib/auth/session";
import { listPurchasesForCustomer } from "@/lib/purchases/purchaseService";

export default async function PortalPage() {
  const customerId = await getSessionCustomerId();
  if (!customerId) {
    redirect("/login");
  }

  const purchases = await listPurchasesForCustomer(customerId);

  return (
    <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold">Your purchases</h1>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="text-sm text-zinc-500 hover:text-zinc-800">
            Log out
          </button>
        </form>
      </div>

      {purchases.length === 0 ? (
        <p className="text-sm text-zinc-500">You don&apos;t have any purchases yet.</p>
      ) : (
        <ul className="space-y-3">
          {purchases.map((purchase) => (
            <li
              key={purchase.id}
              className="flex items-center justify-between border border-zinc-200 rounded-md px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{purchase.product.name}</p>
                <p className="text-xs text-zinc-500">
                  Purchased {purchase.createdAt.toLocaleDateString()}
                </p>
              </div>
              <a
                href={`/api/downloads/${purchase.id}`}
                className="text-sm font-medium bg-black text-white rounded-md px-3 py-1.5 hover:bg-zinc-800"
              >
                Download
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
