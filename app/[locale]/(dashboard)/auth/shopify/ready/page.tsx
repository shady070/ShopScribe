"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || ""; // e.g. https://<your-ngrok>.ngrok-free.app

export default function ShopifyReady() {
  const router = useRouter();
  const params = useSearchParams();
  const shop = params.get("shop") || "";
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!API) {
        setError("Missing NEXT_PUBLIC_API_URL");
        return;
      }
      if (!shop) {
        setError("Missing shop param");
        return;
      }

      try {
        // Mint short-lived access cookie from refresh (set by the callback)
        const res = await fetch(
          `${API}/auth/shopify/session/access?shop=${encodeURIComponent(shop)}`,
          { method: "GET", credentials: "include" }
        );

        // whether success or unauthorized, send user to dashboard (your api client will auto-refresh later)
        if (!res.ok) {
          console.warn("session/access returned", res.status);
        }
        router.replace("/");
      } catch (e: any) {
        console.error(e);
        setError("Could not prepare session");
      }
    })();
  }, [router, shop]);

  if (error) {
    return (
      <div className="p-8 max-w-lg mx-auto">
        <h1 className="text-xl font-semibold mb-2">We couldn’t finalize your session</h1>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <p className="text-sm">
          Please go back to your Shopify admin and open the app again, or{" "}
          <a className="underline" href="/">return home</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="animate-pulse rounded-2xl border p-6 shadow-sm h-14 mb-4" />
      <div className="animate-pulse rounded-2xl border p-6 shadow-sm h-14" />
      <p className="mt-4 text-sm text-gray-600">Preparing your session…</p>
    </div>
  );
}
