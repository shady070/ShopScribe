"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Filter } from "lucide-react";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";

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

  // local client filter (non-breaking enhancement)
  const [query, setQuery] = useState("");

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
        const msg = e instanceof Error ? e.message : t("errors.generic");
        setError(msg);
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
      const msg = e instanceof Error ? e.message : t("errors.generic");
      setError(msg);
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
      const msg = e instanceof Error ? e.message : t("errors.generic");
      setError(msg);
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
  const allOnPageIds = products.map(p => p.id);
  const allSelectedOnPage = allOnPageIds.length > 0 && allOnPageIds.every(id => selected.includes(id));
  const toggleSelectAll = () => {
    setSelected(prev => {
      if (allSelectedOnPage) {
        return prev.filter(id => !allOnPageIds.includes(id));
      }
      const merged = new Set([...prev, ...allOnPageIds]);
      return Array.from(merged);
    });
  };
  const clearSelection = () => setSelected([]);

  // progress bar
  const ProgressBar = ({ used, total }: { used: number; total: number | null }) => {
    if (total === null) {
      return (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span>{t("usage.usageLabel")}</span><span>{t("usage.unlimited")}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
            <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-sky-500" style={{ width: `100%` }} />
          </div>
        </div>
      );
    }
    const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
    return (
      <div className="mt-2">
        <div className="flex justify-between text-xs text-slate-600 mb-1">
          <span>{t("usage.usageLabel")}</span>
          <span>
            {t("usage.usedOf", { used, limit: total })} (
            {t("usage.remainingLabel", { remaining: Math.max(0, total - used) })})
          </span>
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

  // batch generate
  const handleGenerate = async () => {
    if (selected.length === 0) {
      toast({ description: t("alerts.selectAny"), variant: "destructive" });
      return;
    }
    if (!selectedStore) {
      toast({ description: t("alerts.noStore"), variant: "destructive" });
      return;
    }
    if (loadingLang) {
      toast({ description: t("alerts.loadingLang"), variant: "destructive" });
      return;
    }

    const remaining = usageInfo.plan === "PRO" ? Infinity : (usageInfo.remaining as number);
    if (remaining < selected.length) {
      toast({
        description: t("alerts.usageCap", {
          used: usageInfo.used,
          limit: usageInfo.limit ?? t("usage.unlimited")
        }),
        variant: "destructive",
      });
      return;
    }

    const selectedIds = [...selected];
    const selectedCount = selectedIds.length;
    try {
      setLoadingProducts(selectedIds);
      setProducts(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, status: "generating" } : p));

      const res = await apiFetch("/generate/batch", {
        method: "POST",
        body: JSON.stringify({
          productIds: selectedIds,
          storeId: selectedStore,
          language: effectiveLanguage, // pass chosen language
        }),
      });
      const data = await res.json();

      if (res.ok && data?.success) {
        setProducts(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, status: "done" } : p));
        setSelected([]);
        await fetchSubscriptionAndUsage(selectedStore);
        await fetchProducts(selectedStore, 1);
        if (page !== 1) setPage(1);
        toast({ description: t("alerts.batchSuccess", { count: selectedCount }), variant: "success" });
      } else {
        setProducts(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, status: "failed" } : p));
        toast({ description: data?.message || t("errors.generic"), variant: "destructive" });
      }
    } catch (err: unknown) {
      setProducts(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, status: "failed" } : p));
      const errorMessage = err instanceof Error ? err.message : t("errors.generic");
      toast({ description: errorMessage, variant: "destructive" });
    } finally {
      setLoadingProducts([]);
    }
  };

  // gate the whole page until first payloads are ready
  if (booting) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-56 bg-slate-200 rounded" />
        <div className="h-5 w-80 bg-slate-200 rounded" />
        <div className="h-10 w-64 bg-slate-200 rounded" />
        <div className="border rounded-lg mt-4">
          <div className="p-4 border-b">
            <div className="h-5 w-40 bg-slate-200 rounded" />
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="py-4"><div className="h-4 w-4 bg-slate-200 rounded" /></TableCell>
                  <TableCell className="py-4"><div className="h-4 w-56 bg-slate-200 rounded" /></TableCell>
                  <TableCell className="py-4"><div className="h-4 w-24 bg-slate-200 rounded" /></TableCell>
                  <TableCell className="py-4"><div className="h-4 w-40 bg-slate-200 rounded" /></TableCell>
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

  // client-side filtered view (non-breaking)
  const visibleProducts = query
    ? products.filter(p => p.title.toLowerCase().includes(query.toLowerCase()))
    : products;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-100 p-4">
        <h1 className="text-xl font-semibold text-slate-900">{t("header.title")}</h1>
        <p className="text-sm text-slate-600 mt-1">
          {t("header.subtitle")}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 p-3 text-sm">
          {error}
        </div>
      )}

      {/* Usage header with progress */}
      <div className="text-sm mb-2 text-slate-700">
        {usageInfo.plan ? (
          <>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                {t("usage.planLabel")}{" "}
                <b className="text-indigo-700">{usageInfo.plan}</b>{" "}
                {usageInfo.plan === "PRO"
                  ? `— ${t("usage.unlimitedUsage")}`
                  : `— ${t("usage.usedOf", {used: usageInfo.used, limit: usageInfo.limit as number})} (${t("usage.remainingLabel", {remaining: usageInfo.remaining})})`}
              </div>

              {/* Effective language chip */}
              <div className="text-xs">
                <span className="px-2 py-1 rounded-full bg-white border border-indigo-200 text-indigo-800">
                  {t("usage.generatingLanguage")}: <b>{LANG_LABELS[effectiveLanguage] || effectiveLanguage}</b>
                  {storeLangMap[selectedStore]?.language
                    ? ` ${t("usage.storePrefSuffix")}`
                    : ` ${t("usage.profileDefaultSuffix")}`}
                </span>
              </div>
            </div>

            {loadingUsage ? (
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden mt-2" />
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

      {/* Store + Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-2">
        <div className="flex-1 min-w-[240px]">
          <Select
            value={selectedStore}
            onValueChange={(v) => { setSelectedStore(v); setPage(1); }}
            disabled={loadingStores}
          >
            <SelectTrigger className="border-slate-200 focus:ring-indigo-200">
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
        </div>

        {/* Search (client-side) */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center text-xs text-slate-500 gap-1">
            <Filter className="h-4 w-4" />
            {t("ui.filter")}
          </div>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("ui.searchPlaceholder")}
            className="w-full md:w-64 border-slate-200 focus-visible:ring-indigo-200"
          />
        </div>
      </div>

      {/* Selection bar */}
      <div className="flex items-center justify-between rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-2 text-sm text-indigo-900">
        <div className="flex items-center gap-2">
          <Checkbox checked={allSelectedOnPage} onCheckedChange={toggleSelectAll} />
          <span>
            {allSelectedOnPage
              ? t("selection.allOnPageSelected", { count: visibleProducts.length })
              : t("selection.someSelected", { count: selected.length })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={clearSelection} disabled={selected.length === 0} className="border-slate-300 hover:bg-slate-50">
            {t("buttons.clearSelection")}
          </Button>
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
            className="bg-[#214D8D] hover:bg-[#1B4176] text-white"
          >
            {loadingProducts.length > 0 ? t("buttons.generating") : t("buttons.generateSelected")}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-indigo-100 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[44px]"></TableHead>
              <TableHead className="text-slate-700">{t("table.title")}</TableHead>
              <TableHead className="text-slate-700">{t("table.status")}</TableHead>
              <TableHead className="text-slate-700">{t("table.updatedOn")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingList ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="py-4"><div className="h-4 w-4 bg-slate-200 rounded" /></TableCell>
                  <TableCell className="py-4"><div className="h-4 w-56 bg-slate-200 rounded" /></TableCell>
                  <TableCell className="py-4"><div className="h-4 w-24 bg-slate-200 rounded" /></TableCell>
                  <TableCell className="py-4"><div className="h-4 w-40 bg-slate-200 rounded" /></TableCell>
                </TableRow>
              ))
            ) : visibleProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-600">
                  {query ? t("table.noProductsFiltered") : t("table.noProducts")}
                </TableCell>
              </TableRow>
            ) : (
              visibleProducts.map((p) => {
                const isBusy = loadingProducts.includes(p.id) || p.status === "generating";
                return (
                  <TableRow key={p.id} className="hover:bg-indigo-50/40">
                    <TableCell>
                      <Checkbox
                        checked={selected.includes(p.id)}
                        onCheckedChange={() => toggleSelect(p.id)}
                        disabled={loadingProducts.includes(p.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <button
                        className="text-indigo-700 hover:underline"
                        onClick={() => { setModalProduct(p); setOpenModal(true); }}
                        title={t("table.viewDetails")}
                      >
                        {p.title}
                      </button>
                    </TableCell>
                    <TableCell>
                      {isBusy ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> {t("status.generating")}
                        </span>
                      ) : p.status === "done" ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">✅ {t("status.created")}</span>
                      ) : p.status === "failed" ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200">❌ {t("status.failed")}</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200">{t("status.notCreated")}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {new Date(p.updatedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <Button
          variant="outline"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || loadingList}
          className="border-slate-300 hover:bg-slate-50"
        >
          {t("buttons.previous")}
        </Button>
        <span className="text-sm text-slate-600">
          {t("table.pageOf", { page, total: totalPages })}
        </span>
        <Button
          variant="outline"
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasNextPage || loadingList}
          className="border-slate-300 hover:bg-slate-50"
        >
          {t("buttons.next")}
        </Button>
      </div>

      {/* Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-slate-900">{t("modal.title")}</DialogTitle>
          </DialogHeader>
          {modalProduct ? (
            <div className="space-y-2 text-slate-800">
              <p><strong>{t("modal.fields.id")}:</strong> {modalProduct.id}</p>
              <p><strong>{t("modal.fields.title")}:</strong> {modalProduct.title}</p>
              <p><strong>{t("modal.fields.status")}:</strong> {modalProduct.status}</p>
              <p><strong>{t("modal.fields.updatedAt")}:</strong> {new Date(modalProduct.updatedAt).toLocaleString()}</p>
            </div>
          ) : (
            <p className="text-slate-600">{t("modal.noProduct")}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
