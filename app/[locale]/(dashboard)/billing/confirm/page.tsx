"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function BillingConfirmPage() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Processing...");

  useEffect(() => {
    const storeId = localStorage.getItem("storeId");
    const plan = searchParams.get("plan") || "BASIC";
    const chargeId = searchParams.get("chargeId");

    if (!storeId || !chargeId) {
      setMessage("Missing store info or charge ID.");
      return;
    }

    fetch("http://localhost:3001/billing/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, plan, chargeId }),
    })
      .then((res) => res.json())
      .then(() => setMessage("Subscription confirmed! ✅"))
      .catch(() => setMessage("Failed to confirm subscription."));
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">{message}</h1>
    </div>
  );
}
