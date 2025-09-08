"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {useTranslations} from "next-intl";

interface Product {
  id: string;
  title: string;
  status: "not_created" | "generating" | "done" | "failed";
  updatedAt: string;
}

interface Store {
  id: string;
  shopDomain: string;
}

type PlanValue = "FREE" | "BASIC" | "PRO";

interface SubscriptionDTO {
  id: string;
  userId: string;
  plan: PlanValue;
  status: "active" | "pending" | "inactive";
  usageCount: number;
  limit: number | null;
  createdAt: string;
  updatedAt: string;
  shopifyChargeId?: string | null;
  activatedAt?: string | null;
}

interface UsageInfo {
  used: number;
  limit: number | null;
  remaining: number | "∞";
  plan: PlanValue | null;
}

type LanguageCode = "en" | "es" | "fr" | "de" | "it" | "pt" | "nl";

const PAGE_SIZE = 10;

export default function GeneratePage() {
  const t = useTranslations("bulk");

  // state
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingProducts, setLoadingProducts] = useState<string[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  const [activeSub, setActiveSub] = useState<SubscriptionDTO | null>(null);
  const [usageInfo, setUsageInfo] = useState<UsageInfo>({
    used: 0, limit: 0, remaining: 0, plan: null,
  });

  // language sources
  const [defaultLanguage, setDefaultLanguage] = useState<LanguageCode>("en"); // from /settings/me
  const [storeLangMap, setStoreLangMap] = useState<Record<string, { language: LanguageCode }>>({}); // from /settings/store-preferences

  // UX loading gates
  const [booting, setBooting] = useState(true);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingLang, setLoadingLang] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // shop hint from URL (optional)
  const shopHint = useMemo(() => {
    if (typeof window === "undefined") return "";
    const p = new URLSearchParams(window.location.search);
    return p.get("shop") || "";
  }, []);

  // Compute effective language: store preference -> user default -> 'en'
  const effectiveLanguage: LanguageCode = useMemo(() => {
    const storePref = storeLangMap[selectedStore]?.language as LanguageCode | undefined;
    return (storePref || defaultLanguage || "en") as LanguageCode;
  }, [storeLangMap, selectedStore, defaultLanguage]);

  // fetch stores
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingStores(true);
        const res = await apiFetch("/stores");
        if (!res.ok) throw new Error(`Stores failed: ${res.status}`);
        const data = await res.json();
        const fetched: Store[] = Array.isArray(data) ? data : (data?.data?.stores || data?.stores || []);
        if (cancelled) return;

        setStores(fetched);

        // auto-select store: match shopHint first, else first store
        let chosen: Store | undefined;
        if (shopHint) chosen = fetched.find(s => s.shopDomain === shopHint);
        if (!chosen && fetched.length > 0) chosen = fetched[0];

        setSelectedStore(chosen?.id || "");
        setError(null);
      } catch (e: unknown) {
        setError(e?.message || t("errors.generic"));
        setStores([]);
        setSelectedStore("");
      } finally {
        if (!cancelled) setLoadingStores(false);
      }
    })();

    return () => { cancelled = true; };
  }, [shopHint, t]);

  // fetch user profile language + store language prefs
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingLang(true);
        const meRes = await apiFetch("/settings/me");
        if (meRes.ok) {
          const me = await meRes.json();
          const lang = (me?.profile?.language as LanguageCode) || "en";
          if (!cancelled) setDefaultLanguage(lang);
        }
        const pRes = await apiFetch("/settings/store-preferences");
        if (pRes.ok) {
          const pData = await pRes.json();
          const map = (pData?.data || pData) as Record<string, { language: LanguageCode }>;
          if (!cancelled) setStoreLangMap(map || {});
        }
      } finally {
        if (!cancelled) setLoadingLang(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // fetch subscription + usage for the selected store
  const fetchSubscriptionAndUsage = async (storeId: string) => {
    setLoadingUsage(true);
    try {
      const res = await apiFetch(`/billing/current?storeId=${storeId}`);
      if (!res.ok) throw new Error(`Billing current failed: ${res.status}`);
      const data = await res.json();
      const sub: SubscriptionDTO | null = data?.subscriptions?.[0] || null;
      setActiveSub(sub);

      if (sub) {
        const limitNumber =
          typeof sub.limit === "number" ? sub.limit : sub.plan === "PRO" ? Infinity : 0;
        const used = sub.usageCount || 0;
        const remaining =
          sub.plan === "PRO" ? ("∞" as const) : Math.max(0, (limitNumber as number) - used);

        setUsageInfo({
          used,
          limit: sub.plan === "PRO" ? null : (limitNumber as number),
          remaining,
          plan: sub.plan,
        });
      } else {
        setUsageInfo({ used: 0, limit: 0, remaining: 0, plan: null });
      }
    } catch (e: unknown) {
      setError(e?.message || t("errors.generic"));
      setUsageInfo({ used: 0, limit: 0, remaining: 0, plan: null });
    } finally {
      setLoadingUsage(false);
    }
  };

  // fetch products list for selected store/page
  const fetchProducts = async (storeId: string, p: number) => {
    setLoadingList(true);
    try {
      const res = await apiFetch(`/products?storeId=${storeId}&page=${p}&limit=${PAGE_SIZE}`);
      if (!res.ok) throw new Error(`Products failed: ${res.status}`);
      const data = await res.json();
      setProducts(data.data?.products || []);
      setHasNextPage(data.data?.hasNextPage || false);
      setTotalPages(data.data?.totalPages || 1);
      setError(null);
    } catch (e: unknown) {
      setError(e?.message || t("errors.generic"));
      setProducts([]);
    } finally {
      setLoadingList(false);
    }
  };

  // initial page gate
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedStore) { setBooting(false); return; }
      await Promise.all([
        fetchSubscriptionAndUsage(selectedStore),
        fetchProducts(selectedStore, page),
      ]);
      if (!cancelled) setBooting(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore, page]);

  // selection helpers
  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  // progress bar (uses t from outer scope)
  const ProgressBar = ({ used, total }: { used: number; total: number | null }) => {
    if (total === null) {
      return (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{t("usage.usageLabel")}</span><span>{t("usage.unlimited")}</span>
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
          <span>{t("usage.usageLabel")}</span>
          <span>{t("usage.usedOf", {used, limit: total})} ({t("usage.remainingLabel", {remaining: Math.max(0, total - used)})})</span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
          <div className="h-2 rounded-full bg-green-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  // batch generate
  const handleGenerate = async () => {
    if (selected.length === 0) return alert(t("alerts.selectAny"));
    if (!selectedStore) return alert(t("alerts.noStore"));
    if (loadingLang) return alert(t("alerts.loadingLang"));

    const remaining = usageInfo.plan === "PRO" ? Infinity : (usageInfo.remaining as number);
    if (remaining < selected.length) {
      return alert(t("alerts.usageCap", {
        used: usageInfo.used,
        limit: usageInfo.limit ?? t("usage.unlimited")
      }));
    }

    try {
      setLoadingProducts(selected);
      setProducts(prev => prev.map(p => selected.includes(p.id) ? { ...p, status: "generating" } : p));

      const res = await apiFetch("/generate/batch", {
        method: "POST",
        body: JSON.stringify({
          productIds: selected,
          storeId: selectedStore,
          language: effectiveLanguage, // pass chosen language
        }),
      });
      const data = await res.json();

      if (res.ok && data?.success) {
        setProducts(prev => prev.map(p => selected.includes(p.id) ? { ...p, status: "done" } : p));
        setSelected([]);
        await fetchSubscriptionAndUsage(selectedStore);
      } else {
        setProducts(prev => prev.map(p => selected.includes(p.id) ? { ...p, status: "failed" } : p));
        alert(data?.message || t("errors.generic"));
      }
    } catch (err: unknown) {
      setProducts(prev => prev.map(p => selected.includes(p.id) ? { ...p, status: "failed" } : p));
      alert(err?.message || t("errors.generic"));
    } finally {
      setLoadingProducts([]);
    }
  };

  // gate the whole page until first payloads are ready
  if (booting) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-56 bg-gray-200 rounded" />
        <div className="h-5 w-80 bg-gray-200 rounded" />
        <div className="h-10 w-64 bg-gray-200 rounded" />
        <div className="border rounded-lg mt-4">
          <div className="p-4 border-b">
            <div className="h-5 w-40 bg-gray-200 rounded" />
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="py-4"><div className="h-4 w-4 bg-gray-200 rounded" /></TableCell>
                  <TableCell className="py-4"><div className="h-4 w-56 bg-gray-200 rounded" /></TableCell>
                  <TableCell className="py-4"><div className="h-4 w-24 bg-gray-200 rounded" /></TableCell>
                  <TableCell className="py-4"><div className="h-4 w-40 bg-gray-200 rounded" /></TableCell>
                </TableRow>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const LANG_LABELS: Record<LanguageCode, string> = {
    en: t("lang.en"),
    es: t("lang.es"),
    fr: t("lang.fr"),
    de: t("lang.de"),
    it: t("lang.it"),
    pt: t("lang.pt"),
    nl: t("lang.nl"),
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">{t("header.title")}</h1>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
          {error}
        </div>
      )}

      {/* Usage header with progress */}
      <div className="text-sm mb-2 text-gray-700">
        {usageInfo.plan ? (
          <>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                {t("usage.planLabel")} <b>{usageInfo.plan}</b>{" "}
                {usageInfo.plan === "PRO"
                  ? `— ${t("usage.unlimitedUsage")}`
                  : `— ${t("usage.usedOf", {used: usageInfo.used, limit: usageInfo.limit as number})} (${t("usage.remainingLabel", {remaining: usageInfo.remaining})})`}
              </div>

              {/* Show which language will be used */}
              <div className="text-xs">
                <span className="px-2 py-1 rounded-full bg-gray-100 border">
                  {t("usage.generatingLanguage")}: <b>{LANG_LABELS[effectiveLanguage] || effectiveLanguage}</b>
                  {storeLangMap[selectedStore]?.language
                    ? ` ${t("usage.storePrefSuffix")}`
                    : ` ${t("usage.profileDefaultSuffix")}`}
                </span>
              </div>
            </div>

            {loadingUsage ? (
              <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden mt-2" />
            ) : (
              <ProgressBar
                used={usageInfo.used}
                total={usageInfo.plan === "PRO" ? null : (usageInfo.limit as number)}
              />
            )}
          </>
        ) : (
          <span>{t("usage.noPlan")}</span>
        )}
      </div>

      {/* Store Select */}
      <Select
        value={selectedStore}
        onValueChange={(v) => { setSelectedStore(v); setPage(1); }}
        disabled={loadingStores}
      >
        <SelectTrigger>
          <SelectValue placeholder={loadingStores ? t("ui.loadingStores") : t("ui.selectStore")} />
        </SelectTrigger>
        <SelectContent>
          {stores.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.shopDomain}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Table className="mt-4">
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>{t("table.title")}</TableHead>
            <TableHead>{t("table.status")}</TableHead>
            <TableHead>{t("table.updatedOn")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loadingList ? (
            Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="py-4"><div className="h-4 w-4 bg-gray-200 rounded" /></TableCell>
                <TableCell className="py-4"><div className="h-4 w-56 bg-gray-200 rounded" /></TableCell>
                <TableCell className="py-4"><div className="h-4 w-24 bg-gray-200 rounded" /></TableCell>
                <TableCell className="py-4"><div className="h-4 w-40 bg-gray-200 rounded" /></TableCell>
              </TableRow>
            ))
          ) : products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6">
                {t("table.noProducts")}
              </TableCell>
            </TableRow>
          ) : (
            products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Checkbox
                    checked={selected.includes(p.id)}
                    onCheckedChange={() => toggleSelect(p.id)}
                    disabled={loadingProducts.includes(p.id)}
                  />
                </TableCell>
                <TableCell>
                  <button
                    className="text-blue-600 underline"
                    onClick={() => { setModalProduct(p); setOpenModal(true); }}
                  >
                    {p.title}
                  </button>
                </TableCell>
                <TableCell>
                  {loadingProducts.includes(p.id) || p.status === "generating" ? (
                    <span className="flex items-center text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin mr-1" /> {t("status.generating")}
                    </span>
                  ) : p.status === "done" ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-200 text-green-700">✅ {t("status.created")}</span>
                  ) : p.status === "failed" ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-200 text-red-700">❌ {t("status.failed")}</span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">{t("status.notCreated")}</span>
                  )}
                </TableCell>
                <TableCell>{new Date(p.updatedAt).toLocaleString()}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between mt-4">
        <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loadingList}>
          {t("buttons.previous")}
        </Button>
        <span className="text-sm text-gray-600">
          {t("table.pageOf", {page, total: totalPages})}
        </span>
        <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={!hasNextPage || loadingList}>
          {t("buttons.next")}
        </Button>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={
          selected.length === 0 ||
          loadingProducts.length > 0 ||
          !usageInfo.plan ||
          (usageInfo.plan !== "PRO" &&
            typeof usageInfo.remaining === "number" &&
            usageInfo.remaining <= 0)
        }
        className="mt-4"
      >
        {loadingProducts.length > 0 ? t("buttons.generating") : t("buttons.generateSelected")}
      </Button>

      {/* Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("modal.title")}</DialogTitle>
          </DialogHeader>
          {modalProduct ? (
            <div className="space-y-2">
              <p><strong>{t("modal.fields.id")}:</strong> {modalProduct.id}</p>
              <p><strong>{t("modal.fields.title")}:</strong> {modalProduct.title}</p>
              <p><strong>{t("modal.fields.status")}:</strong> {modalProduct.status}</p>
              <p><strong>{t("modal.fields.updatedAt")}:</strong> {new Date(modalProduct.updatedAt).toLocaleString()}</p>
            </div>
          ) : (
            <p>{t("modal.noProduct")}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
