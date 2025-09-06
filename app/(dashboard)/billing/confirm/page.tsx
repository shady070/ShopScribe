"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BillingConfirmPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storeId = searchParams.get("storeId");
    const plan = searchParams.get("plan");
    const chargeId = searchParams.get("chargeId");

    if (!storeId || !plan || !chargeId) {
      setError("Missing required parameters.");
      setLoading(false);
      return;
    }

    const confirmSubscription = async () => {
      try {
        const res = await fetch("http://localhost:3001/billing/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId, plan, chargeId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to confirm");

        // ✅ Redirect after success
        router.replace("/?billing=success");
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    confirmSubscription();
  }, [searchParams, router]);

  if (loading) return <p>Confirming subscription...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return <p>Subscription confirmed! Redirecting...</p>;
}
