"use client";

import { useState, useEffect } from "react";

const plans = [
  { name: "Free", price: "$0", description: "For testing and small stores", features: ["Generate up to 10 products","Single store only","Basic support"], value: "FREE" },
  { name: "Basic", price: "$12 /mo", description: "For growing stores", features: ["Generate up to 200 products","Single store only","Priority support"], value: "BASIC" },
  { name: "Pro", price: "$32 /mo", description: "For agencies & multi-store owners", features: ["Unlimited product generation","Multi-store support","Premium support"], value: "PRO" },
];

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [shopDomain, setShopDomain] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<string | null>(null);

  // 🔹 Load from localStorage + get active plan from backend
  useEffect(() => {
    const sId = localStorage.getItem("storeId");
    const sDomain = localStorage.getItem("shopDomain");
    setStoreId(sId);
    setShopDomain(sDomain);

    if (sId) {
      fetch(`http://localhost:3001/billing/current?storeId=${sId}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("🔍 Current subscription:", data);
          if (data?.plan) setActivePlan(data.plan);
        })
        .catch((err) => console.error("❌ Failed to load current plan:", err));
    }
  }, []);

  const handleSubscribe = async (plan: string) => {
    setLoading(plan);

    try {
      if (!storeId || !shopDomain) {
        console.warn("❌ Missing info:", { storeId, shopDomain });
        alert("❌ Missing store info. Please re-login.");
        return;
      }

      const returnUrl = `${window.location.origin}/billing/confirm?storeId=${storeId}&plan=${plan}`;

      const res = await fetch("http://localhost:3001/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, plan, returnUrl }),
      });

      if (!res.ok) throw new Error("Failed to start subscription");

      const data = await res.json();

      if (plan === "FREE") {
        alert("✅ Free plan activated automatically!");
        setActivePlan("FREE");
      } else if (data.confirmationUrl) {
        // Shopify checkout (future)
        window.location.href = data.confirmationUrl;
      }
    } catch (err) {
      console.error("❌ Subscription error:", err);
      alert("❌ Something went wrong. Try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-16 px-6">
      <h1 className="text-4xl font-bold text-center mb-4">Choose Your Plan</h1>
      <p className="text-center text-gray-500 mb-12">
        Select the plan that fits your store’s needs.
      </p>

      {(!storeId || !shopDomain) && (
        <p className="text-red-500 text-center mb-6">
          ⚠️ Store info missing. Please re-login to continue.
        </p>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl shadow-lg border p-8 flex flex-col justify-between transition ${
              activePlan === plan.value ? "border-green-500 shadow-green-200" : "border-gray-200"
            }`}
          >
            <div>
              <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>
              <p className="text-3xl font-bold mb-2">{plan.price}</p>
              <p className="text-gray-500 mb-6">{plan.description}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-gray-700">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {activePlan === plan.value ? (
              <button
                disabled
                className="w-full py-3 rounded-xl font-semibold bg-green-500 text-white cursor-default"
              >
                Active
              </button>
            ) : (
              <button
                onClick={() => handleSubscribe(plan.value)}
                disabled={loading === plan.value}
                className={`w-full py-3 rounded-xl font-semibold transition ${
                  loading === plan.value
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                {loading === plan.value ? "Processing..." : "Subscribe"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
