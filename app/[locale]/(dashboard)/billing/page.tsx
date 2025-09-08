"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useTranslations } from "next-intl";

type PlanValue = "FREE" | "BASIC" | "PRO";
const FREE_LIMIT = 10;

type SubscriptionDTO = {
  id: string;
  userId: string;
  plan: PlanValue;
  status: "active" | "pending" | "inactive";
  usageCount: number;
  limit: number | null;
  shopifyChargeId?: string | null;
  activatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

interface Store {
  id: string;
  shopDomain: string;
}

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function BillingPage() {
  const t = useTranslations("billing");

  // Store selection
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");

  // Sub / usage
  const [activePlan, setActivePlan] = useState<PlanValue | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionDTO | null>(null);
  const [usageData, setUsageData] = useState<{
    usageCount: number;
    limit: number | "∞";
    remaining: number | "∞";
  } | null>(null);
  const [freeEligibleEver, setFreeEligibleEver] = useState<boolean>(true);

  // UI state
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Switch plan modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<PlanValue | null>(null);

  // shop hint from URL
  const shopHint = useMemo(() => {
    if (typeof window === "undefined") return "";
    const p = new URLSearchParams(window.location.search);
    return p.get("shop") || "";
  }, []);

  // i18n helpers for plan labels
  const planName = (p: PlanValue) => {
    const k = p.toLowerCase() as "free" | "basic" | "pro";
    return t(`plans.${k}.name`);
  };

  // Build localized plans
  const plans = useMemo(() => {
    const raw = (key: string) => (t as any).raw(key) as string[]; // for arrays
    return [
      {
        name: t("plans.free.name"),
        price: t("plans.free.price"),
        description: t("plans.free.description"),
        features: raw("plans.free.features"),
        value: "FREE" as PlanValue,
        limit: FREE_LIMIT,
      },
      {
        name: t("plans.basic.name"),
        price: t("plans.basic.price"),
        description: t("plans.basic.description"),
        features: raw("plans.basic.features"),
        value: "BASIC" as PlanValue,
        limit: 200,
      },
      {
        name: t("plans.pro.name"),
        price: t("plans.pro.price"),
        description: t("plans.pro.description"),
        features: raw("plans.pro.features"),
        value: "PRO" as PlanValue,
        limit: Infinity,
      },
    ];
  }, [t]);

  // Load stores and pick default
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const res = await apiFetch("/stores");
        if (!res.ok) throw new Error(`Stores failed: ${res.status}`);
        const data = await res.json();
        const fetched: Store[] = Array.isArray(data)
          ? data
          : data?.data?.stores || data?.stores || [];
        if (cancelled) return;

        setStores(fetched);

        let chosen: Store | undefined;
        if (shopHint) chosen = fetched.find((s) => s.shopDomain === shopHint);
        if (!chosen) chosen = fetched[0];
        setSelectedStoreId(chosen?.id || "");
      } catch (e: any) {
        setError(e?.message || t("errors.stores"));
        setStores([]);
        setSelectedStoreId("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shopHint, t]);

  // With store selected, bootstrap subscription + usage
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedStoreId) {
        setBooting(false);
        return;
      }
      setBooting(true);
      setError(null);
      try {
        const res = await apiFetch(`/billing/current?storeId=${selectedStoreId}`);
        const data = await res.json();

        const currentSub: SubscriptionDTO | null = data?.subscriptions?.[0] || null;
        if (cancelled) return;

        setSubscriptionData(currentSub);
        setActivePlan((currentSub?.plan as PlanValue) || null);
        setFreeEligibleEver(
          typeof data?.freeEligibleEver === "boolean" ? data.freeEligibleEver : true
        );

        if (currentSub) {
          const used = currentSub.usageCount || 0;
          if (currentSub.plan === "PRO") {
            setUsageData({ usageCount: used, limit: "∞", remaining: "∞" });
          } else {
            const limitNumber =
              typeof currentSub.limit === "number"
                ? currentSub.limit
                : currentSub.plan === "FREE"
                ? FREE_LIMIT
                : 0;
            const remaining = Math.max(0, limitNumber - used);
            setUsageData({
              usageCount: used,
              limit: limitNumber,
              remaining,
            });
          }
        } else {
          setUsageData(null);
        }
      } catch (e: any) {
        setError(e?.message || t("errors.subscription"));
        setUsageData(null);
        setActivePlan(null);
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedStoreId, t]);

  const isSwitchingRequired = useMemo(
    () => (target: PlanValue) => activePlan && activePlan !== target,
    [activePlan]
  );

  const ProgressBar = ({ used, total }: { used: number; total: number | "∞" }) => {
    if (total === "∞") {
      return (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{t("usage.label")}</span>
            <span>{t("usage.unlimited")}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
            <div className="h-2 rounded-full bg-green-500" style={{ width: `100%` }} />
          </div>
        </div>
      );
    }
    const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
    return (
      <div className="mt-2">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>{t("usage.label")}</span>
          <span>{t("usage.usedOfPct", { used, total, pct })}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
          <div className="h-2 rounded-full bg-green-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  async function refreshSubscription() {
    if (!selectedStoreId) return;
    const res = await apiFetch(`/billing/current?storeId=${selectedStoreId}`);
    const data = await res.json();
    const currentSub: SubscriptionDTO | null = data?.subscriptions?.[0] || null;

    setSubscriptionData(currentSub);
    setActivePlan((currentSub?.plan as PlanValue) || null);
    setFreeEligibleEver(
      typeof data?.freeEligibleEver === "boolean" ? data.freeEligibleEver : true
    );

    if (currentSub) {
      const used = currentSub.usageCount || 0;
      if (currentSub.plan === "PRO") {
        setUsageData({ usageCount: used, limit: "∞", remaining: "∞" });
      } else {
        const limitNumber =
          typeof currentSub.limit === "number"
            ? currentSub.limit
            : currentSub.plan === "FREE"
            ? FREE_LIMIT
            : 0;
        const remaining = Math.max(0, limitNumber - used);
        setUsageData({
          usageCount: used,
          limit: limitNumber,
          remaining,
        });
      }
    } else {
      setUsageData(null);
    }
  }

  const handleSubscribe = async (plan: PlanValue) => {
    if (!selectedStoreId || booting) return;
    setLoading(plan);
    setError(null);

    if (isSwitchingRequired(plan)) {
      setPendingPlan(plan);
      setConfirmOpen(true);
      setLoading(null);
      return;
    }

    if (plan === "FREE" && !freeEligibleEver) {
      alert(t("alerts.freeOnce"));
      setLoading(null);
      return;
    }

    try {
      const returnUrl = `${window.location.origin}/billing/confirm?plan=${plan}`;
      const res = await apiFetch("/billing/subscribe", {
        method: "POST",
        body: JSON.stringify({ storeId: selectedStoreId, plan, returnUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data?.code === "ACTIVE_PLAN_EXISTS") {
          setPendingPlan(plan);
          setConfirmOpen(true);
          return;
        }
        if (data?.code === "FREE_LIFETIME_USED") {
          setFreeEligibleEver(false);
          alert(t("alerts.freeOnce"));
          return;
        }
        throw new Error(data?.message || t("errors.generic"));
      }

      if (plan === "FREE") {
        await refreshSubscription();
        setFreeEligibleEver(false);
        alert(t("alerts.freeActivated"));
      } else if (data.confirmationUrl) {
        window.location.href = data.confirmationUrl;
      }
    } catch (err: any) {
      setError(err?.message || t("errors.generic"));
      alert(err?.message || t("errors.generic"));
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async (plan: PlanValue) => {
    if (!selectedStoreId || booting) return;
    setLoading(plan);
    try {
      const res = await apiFetch("/billing/cancel", {
        method: "POST",
        body: JSON.stringify({ storeId: selectedStoreId, plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || t("errors.cancelFailed"));

      await refreshSubscription();
      const label = planName(plan);
      alert(t("alerts.cancelled", { plan: label }));
    } catch (err: any) {
      alert(err?.message || t("errors.cancelFailed"));
    } finally {
      setLoading(null);
    }
  };

  // Skeleton card
  const SkeletonCard = () => (
    <div className="rounded-2xl border border-gray-200 p-8 shadow-sm animate-pulse">
      <div className="h-6 w-32 bg-gray-200 rounded mb-3" />
      <div className="h-8 w-40 bg-gray-200 rounded mb-4" />
      <div className="h-4 w-full bg-gray-200 rounded mb-6" />
      <div className="space-y-2 mb-6">
        <div className="h-4 w-5/6 bg-gray-200 rounded" />
        <div className="h-4 w-4/6 bg-gray-200 rounded" />
        <div className="h-4 w-3/6 bg-gray-200 rounded" />
      </div>
      <div className="h-10 w-full bg-gray-300 rounded" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-16 px-6">
      <h1 className="text-4xl font-bold text-center mb-4">{t("header.title")}</h1>
      <p className="text-center text-gray-500 mb-6">{t("header.subtitle")}</p>

      {/* Optional: quick store indicator */}
      {stores.length > 1 && (
        <p className="text-center text-sm text-gray-500 mb-8">
          {t("activeStore")}{" "}
          <b>{stores.find((s) => s.id === selectedStoreId)?.shopDomain || "—"}</b>
        </p>
      )}

      {error && <p className="text-red-500 text-center mb-6">{error}</p>}

      <div className="grid md:grid-cols-3 gap-8">
        {booting ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          plans.map((plan) => {
            const isActive = activePlan === plan.value;
            const isPaid = plan.value !== "FREE";

            // Active plan usage (FREE/BASIC/PRO)
            const activeUsage =
              isActive && usageData
                ? {
                    used: usageData.usageCount,
                    total: plan.value === "PRO" ? ("∞" as const) : (usageData.limit as number | "∞"),
                  }
                : null;

            // Only show the “Free plan already used (10/10)” banner when FREE is NOT active
            const freeUsedForever = plan.value === "FREE" && !freeEligibleEver && !isActive;

            // button state
            let buttonText = t("buttons.subscribe");
            let disabled = !!loading;

            if (freeUsedForever) {
              buttonText = t("free.usedBadge", { limit: FREE_LIMIT });
              disabled = true;
            } else if (isActive) {
              buttonText = t("buttons.active");
              disabled = true;
            } else if (loading === plan.value) {
              buttonText = t("buttons.processing");
              disabled = true;
            } else if (activePlan && activePlan !== plan.value) {
              buttonText = t("buttons.switchPlan");
              disabled = false;
            } else {
              disabled = false;
            }

            return (
              <div
                key={plan.name}
                className={cn(
                  "rounded-2xl shadow-lg border p-8 flex flex-col justify-between transition",
                  isActive ? "border-green-500 shadow-green-200" : "border-gray-200"
                )}
              >
                <div>
                  <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>
                  <p className="text-3xl font-bold mb-2">{plan.price}</p>
                  <p className="text-gray-500 mb-6">{plan.description}</p>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-gray-700">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* Active plan progress (FREE/BASIC/PRO) */}
                  {activeUsage && <ProgressBar used={activeUsage.used} total={activeUsage.total} />}

                  {/* FREE lifetime used: full 10/10 bar (only when FREE is NOT active) */}
                  {freeUsedForever && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{t("usage.label")}</span>
                        <span>{t("usage.usedOfPct", { used: FREE_LIMIT, total: FREE_LIMIT, pct: 100 })}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-2 rounded-full bg-gray-500" style={{ width: `100%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{t("free.usedOnceNote")}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 mt-6">
                  <button
                    onClick={() => handleSubscribe(plan.value)}
                    disabled={disabled}
                    className={cn(
                      "w-full py-3 rounded-xl font-semibold transition",
                      disabled ? "bg-gray-400 cursor-not-allowed" : "bg-black text-white hover:bg-gray-800"
                    )}
                  >
                    {buttonText}
                  </button>

                  {isActive && isPaid && (
                    <button
                      onClick={() => handleCancel(plan.value)}
                      disabled={!!loading}
                      className="w-full py-2 rounded-xl font-semibold border border-red-500 text-red-500 hover:bg-red-50 transition"
                    >
                      {t("buttons.cancel")}
                    </button>
                  )}

                  {!booting && activePlan && activePlan !== plan.value && (
                    <p className="text-xs text-gray-500 text-center">
                      {t("confirm.body", {
                        current: planName(activePlan),
                        target: plan.name,
                      })}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirm modal for switching */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-semibold mb-2">{t("confirm.title")}</h3>
            <p className="text-gray-600 mb-4">
              {t("confirm.body", {
                current: activePlan ? planName(activePlan) : "",
                target: pendingPlan ? planName(pendingPlan) : "",
              })}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-xl border"
                onClick={() => {
                  setConfirmOpen(false);
                  setPendingPlan(null);
                }}
              >
                {t("buttons.keepCurrent")}
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-red-600 text-white"
                onClick={async () => {
                  if (!activePlan || !selectedStoreId || !pendingPlan) return;
                  setLoading("CANCEL_THEN_SUBSCRIBE");
                  try {
                    await handleCancel(activePlan);
                    await handleSubscribe(pendingPlan);
                  } finally {
                    setConfirmOpen(false);
                    setPendingPlan(null);
                    setLoading(null);
                  }
                }}
              >
                {t("buttons.cancelAndContinue")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
