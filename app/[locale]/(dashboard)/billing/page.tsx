"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/use-toast";

type PlanValue = "FREE" | "BASIC" | "PRO";

const PLAN_LIMITS: Record<PlanValue, number> = {
  FREE: 10,
  BASIC: 100,
  PRO: 250,
};

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
    limit: number;
    remaining: number;
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

  // Build localized plans (limits reflect backend)
  const plans = useMemo(() => {
    const raw = (key: string) => (t as any).raw(key) as string[];
    return [
      {
        name: t("plans.free.name"),
        price: t("plans.free.price"),
        description: t("plans.free.description"),
        features: raw("plans.free.features"),
        value: "FREE" as PlanValue,
        limit: PLAN_LIMITS.FREE,
      },
      {
        name: t("plans.basic.name"),
        price: t("plans.basic.price"),
        description: t("plans.basic.description"),
        features: raw("plans.basic.features"),
        value: "BASIC" as PlanValue,
        limit: PLAN_LIMITS.BASIC,
      },
      {
        name: t("plans.pro.name"),
        price: t("plans.pro.price"),
        description: t("plans.pro.description"),
        features: raw("plans.pro.features"),
        value: "PRO" as PlanValue,
        limit: PLAN_LIMITS.PRO,
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
          // Use DB limit if present, else fall back to our known caps
          const cap =
            typeof currentSub.limit === "number" && currentSub.limit > 0
              ? currentSub.limit
              : PLAN_LIMITS[currentSub.plan];

          const remaining = Math.max(0, cap - used);
          setUsageData({ usageCount: used, limit: cap, remaining });
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

  const ProgressBar = ({ used, total }: { used: number; total: number }) => {
    const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
    return (
      <div className="mt-3">
        <div className="flex justify-between text-xs text-slate-600 mb-1">
          <span>{t("usage.label")}</span>
          <span>{t("usage.usedOfPct", { used, total, pct })}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-sky-500"
            style={{ width: `${pct}%` }}
          />
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
      const cap =
        typeof currentSub.limit === "number" && currentSub.limit > 0
          ? currentSub.limit
          : PLAN_LIMITS[currentSub.plan];
      const remaining = Math.max(0, cap - used);
      setUsageData({ usageCount: used, limit: cap, remaining });
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
      toast({ description: t("alerts.freeOnce"), variant: "destructive" });
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
          toast({ description: t("alerts.freeOnce"), variant: "destructive" });
          return;
        }
        throw new Error(data?.message || t("errors.generic"));
      }

      if (plan === "FREE") {
        await refreshSubscription();
        setFreeEligibleEver(false);
        toast({ description: t("alerts.freeActivated"), variant: "success" });
      } else if (data.confirmationUrl) {
        window.location.href = data.confirmationUrl;
      }
    } catch (err: any) {
      setError(err?.message || t("errors.generic"));
      toast({ description: err?.message || t("errors.generic"), variant: "destructive" });
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
      toast({ description: t("alerts.cancelled", { plan: label }), variant: "success" });
    } catch (err: any) {
      toast({ description: err?.message || t("errors.cancelFailed"), variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  // Skeleton card
  const SkeletonCard = () => (
    <div className="rounded-2xl border border-indigo-100 p-8 shadow-sm animate-pulse bg-white/70">
      <div className="h-6 w-32 bg-slate-200 rounded mb-3" />
      <div className="h-8 w-40 bg-slate-200 rounded mb-4" />
      <div className="h-4 w-full bg-slate-200 rounded mb-6" />
      <div className="space-y-2 mb-6">
        <div className="h-4 w-5/6 bg-slate-200 rounded" />
        <div className="h-4 w-4/6 bg-slate-200 rounded" />
        <div className="h-4 w-3/6 bg-slate-200 rounded" />
      </div>
      <div className="h-10 w-full bg-slate-300 rounded" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-10 md:py-16 px-4 md:px-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-100 p-5 md:p-6 mb-6">
        <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-2">
          {t("header.title")}
        </h1>
        <p className="text-slate-600">{t("header.subtitle")}</p>
      </div>

      {/* Active store note */}
      {stores.length > 1 && (
        <p className="text-center text-sm text-slate-600 mb-8">
          {t("activeStore")}{" "}
          <b className="text-indigo-700">
            {stores.find((s) => s.id === selectedStoreId)?.shopDomain || "—"}
          </b>
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 p-3 text-sm text-center mb-6">
          {error}
        </div>
      )}

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6 md:gap-8">
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

            // Active plan usage
            const activeUsage =
              isActive && usageData
                ? { used: usageData.usageCount, total: usageData.limit }
                : null;

            // FREE lifetime used (only when FREE is NOT active)
            const freeUsedForever = plan.value === "FREE" && !freeEligibleEver && !isActive;

            // button state
            let buttonText = t("buttons.subscribe");
            let disabled = !!loading;

            if (freeUsedForever) {
              buttonText = t("free.usedBadge", { limit: PLAN_LIMITS.FREE });
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
                  "rounded-2xl shadow-lg border p-6 md:p-8 flex flex-col justify-between transition bg-white/95",
                  isActive
                    ? "border-emerald-400 ring-1 ring-emerald-200"
                    : "border-indigo-100 hover:ring-1 hover:ring-indigo-100"
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
                        {plan.name}
                      </h2>
                      <p className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
                        {plan.price}
                      </p>
                    </div>

                    {/* Active badge */}
                    {isActive && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                        {t("buttons.active")}
                      </span>
                    )}
                  </div>

                  <p className="text-slate-600 mt-3 mb-5">{plan.description}</p>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-slate-800">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {activeUsage && (
                    <ProgressBar used={activeUsage.used} total={activeUsage.total} />
                  )}

                  {/* FREE lifetime used bar (when FREE is NOT active) */}
                  {freeUsedForever && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span>{t("usage.label")}</span>
                        <span>
                          {t("usage.usedOfPct", {
                            used: PLAN_LIMITS.FREE,
                            total: PLAN_LIMITS.FREE,
                            pct: 100,
                          })}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-2 rounded-full bg-slate-400" style={{ width: `100%` }} />
                      </div>
                      <p className="text-xs text-slate-500 mt-2">{t("free.usedOnceNote")}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 mt-6">
                  <button
                    onClick={() => handleSubscribe(plan.value)}
                    disabled={disabled}
                    className={cn(
                      "w-full py-3 rounded-xl font-semibold transition",
                      disabled
                        ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                        : "bg-[#214D8D] text-white hover:bg-[#1B4176] shadow-sm"
                    )}
                  >
                    {buttonText}
                  </button>

                  {isActive && isPaid && (
                    <button
                      onClick={() => handleCancel(plan.value)}
                      disabled={!!loading}
                      className="w-full py-2 rounded-xl font-semibold border border-rose-500 text-rose-600 hover:bg-rose-50 transition"
                    >
                      {t("buttons.cancel")}
                    </button>
                  )}

                  {!booting && activePlan && activePlan !== plan.value && (
                    <p className="text-xs text-slate-500 text-center">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-indigo-100">
            <h3 className="text-xl font-semibold mb-2 text-slate-900">{t("confirm.title")}</h3>
            <p className="text-slate-600 mb-4">
              {t("confirm.body", {
                current: activePlan ? planName(activePlan) : "",
                target: pendingPlan ? planName(pendingPlan) : "",
              })}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
                onClick={() => {
                  setConfirmOpen(false);
                  setPendingPlan(null);
                }}
              >
                {t("buttons.keepCurrent")}
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700"
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
