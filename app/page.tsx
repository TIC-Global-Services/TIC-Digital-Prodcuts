import { redirect } from "next/navigation";
import { getSessionCustomerId } from "@/lib/auth/session";

export default async function Home() {
  const customerId = await getSessionCustomerId();
  redirect(customerId ? "/portal" : "/login");
}
