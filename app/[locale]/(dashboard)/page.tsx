"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy, Loader2, Maximize2, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

type Store = { id: string; shopDomain: string };
type Product = {
  id: string;
  title: string;
  status:
    | "idle"
    | "generating"
    | "done"
    | "failed"
    | "active"
    | "draft"
    | "published";
  updatedAt: string;
  aiDescription?: string | null;
  aiMetaDescription?: string | null;
  aiTags?: string | null;
};

/** Colorful, trustworthy status badge (no extra deps) */
function Badge({
  children,
  color = "slate",
  className = "",
}: {
  children: React.ReactNode;
  color?: "slate" | "green" | "blue" | "amber" | "red";
  className?: string;
}) {
  const map: Record<string, string> = {
    slate:
      "bg-slate-100 text-slate-800 ring-1 ring-inset ring-slate-200",
    green:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    blue:
      "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200",
    amber:
      "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200",
    red:
      "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${map[color]} ${className}`}
    >
      {children}
    </span>
  );
}

const statusColor: Record<
  Product["status"],
  Parameters<typeof Badge>[0]["color"]
> = {
  idle: "slate",
  generating: "amber",
  done: "blue",
  failed: "red",
  draft: "slate",
  active: "green",
  published: "blue",
};

export default function DashboardPage() {
  const t = useTranslations("dashboard");

  // ---------- state ----------
  const [stores, setStores] = useState<Store[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);

  const [selectedStore, setSelectedStore] = useState<string>("");

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [recentResults, setRecentResults] = useState<Product[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);

  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("neutral");
  const [generating, setGenerating] = useState(false);

  // edit modal
  const [open, setOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<Product | null>(null);
  const [editedDescription, setEditedDescription] = useState("");
  const [editedMeta, setEditedMeta] = useState("");
  const [editedTags, setEditedTags] = useState("");
  const [editedStatus, setEditedStatus] = useState<
    "draft" | "active" | "published"
  >("draft");
  const [saving, setSaving] = useState(false);

  // ---------- helpers ----------
  const metaLength = editedMeta?.length ?? 0;

  // ---------- fetch stores (on mount) ----------
  useEffect(() => {
    (async () => {
      try {
        setStoresLoading(true);
        const res = await apiFetch("/stores");
        const data = res.ok ? await res.json() : {};
        const fetchedStores: Store[] = Array.isArray(data)
          ? data
          : data?.data?.stores || data?.stores || [];
        setStores(fetchedStores);

        // pick preferred store if any
        const preferred =
          typeof window !== "undefined"
            ? localStorage.getItem("storeId")
            : null;
        let next = fetchedStores[0]?.id || "";
        if (preferred && fetchedStores.some((s) => s.id === preferred))
          next = preferred;

        if (next) {
          setSelectedStore(next);
          localStorage.setItem("storeId", next);
        }
      } catch {
        setStores([]);
      } finally {
        setStoresLoading(false);
      }
    })();
  }, []);

  // ---------- fetch products + recent + activities when store changes ----------
  const loadStoreData = async (storeId: string) => {
    setProductsLoading(true);
    setRecentLoading(true);
    setActivitiesLoading(true);
    try {
      const [pRes, rRes, aRes] = await Promise.all([
        apiFetch(`/products?storeId=${storeId}`),
        apiFetch(`/products/recent?storeId=${storeId}`),
        apiFetch(`/activities?storeId=${storeId}`),
      ]);
      const pData = pRes.ok ? await pRes.json() : {};
      const rData = rRes.ok ? await rRes.json() : {};
      const aData = aRes.ok ? await aRes.json() : {};
      setProducts(pData?.data?.products || []);
      setRecentResults(rData?.data || []);
      setActivities(aData?.data || []);
    } catch {
      setProducts([]);
      setRecentResults([]);
      setActivities([]);
    } finally {
      setProductsLoading(false);
      setRecentLoading(false);
      setActivitiesLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedStore) return;
    loadStoreData(selectedStore);
  }, [selectedStore]);

  // ---------- optional auto-sync from Shopify ----------
  const syncFromShopify = async () => {
    if (!selectedStore) return;
    try {
      setSyncing(true);
      await apiFetch(`/products/fetch?storeId=${selectedStore}`);
      const res = await apiFetch(`/products?storeId=${selectedStore}`);
      const data = await res.json();
      setProducts(data?.data?.products || []);
    } catch (err) {
      console.error("❌ Products sync failed", err);
    } finally {
      setSyncing(false);
    }
  };

  const initialStoreSync = useRef(true);

  useEffect(() => {
    if (!selectedStore) return;
    if (initialStoreSync.current) {
      initialStoreSync.current = false;
      return;
    }
    // fire and forget
    syncFromShopify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore]);

  // ---------- quick generate ----------
  const handleQuickGenerate = async () => {
    if (!selectedProduct) {
      toast({ description: t("alerts.selectProduct"), variant: "destructive" });
      return;
    }
    try {
      setGenerating(true);
      const res = await apiFetch("/generate/quick", {
        method: "POST",
        body: JSON.stringify({
          productId: selectedProduct,
          tone,
          keywords: keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          // ❌ no language here: backend picks store/user preference
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ description: t("alerts.quickSuccess"), variant: "success" });
        // refresh recent list
        const rr = await apiFetch(`/products/recent?storeId=${selectedStore}`);
        const rdata = await rr.json();
        setRecentResults(rdata.data || []);
        // refresh products to update status
        const pr = await apiFetch(`/products?storeId=${selectedStore}`);
        const pdata = await pr.json();
        setProducts(pdata?.data?.products || []);
        // refresh activities feed
        try {
          setActivitiesLoading(true);
          const aRes = await apiFetch(`/activities?storeId=${selectedStore}`);
          const aData = aRes.ok ? await aRes.json() : {};
          setActivities(aData?.data || []);
        } catch {
          setActivities([]);
        } finally {
          setActivitiesLoading(false);
        }
      } else {
        toast({
          description: t("alerts.quickFail", {
            message: data.message || t("errors.generic"),
          }),
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        description: t("alerts.quickFail", {
          message: err?.message || t("errors.generic"),
        }),
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  // ---------- copy ----------
  const handleCopy = (text?: string | null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ description: t("alerts.copied"), variant: "success" });
  };

  // ---------- open modal for edit ----------
  const handleExpand = (result: Product) => {
    setSelectedResult(result);
    setEditedDescription(result.aiDescription || "");
    setEditedMeta(result.aiMetaDescription || "");
    setEditedTags(result.aiTags || "");
    // keep whatever status existing or default draft
    const s = (result.status as "draft" | "active" | "published") || "draft";
    setEditedStatus(s);
    setOpen(true);
  };

  // ---------- save edit ----------
  const handleSave = async () => {
    if (!selectedResult) return;
    try {
      setSaving(true);
      const res = await apiFetch(`/products/${selectedResult.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...selectedResult,
          aiDescription: editedDescription,
          aiMetaDescription: editedMeta,
          aiTags: editedTags,
          status: editedStatus,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ description: t("alerts.productUpdated"), variant: "success" });
        setOpen(false);
        // refresh recent/products
        loadStoreData(selectedStore);
      } else {
        toast({
          description: t("alerts.updateFail", {
            message: data.message || t("errors.generic"),
          }),
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        description: t("alerts.updateFail", {
          message: err?.message || t("errors.generic"),
        }),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // ---------- UI bits ----------
  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-base font-semibold tracking-tight text-slate-900">
      {children}
    </h2>
  );

  const SectionHint = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[12px] text-slate-600">{children}</p>
  );

  const SkeletonRow = () => (
    <div className="rounded-xl border p-3 animate-pulse bg-white/60">
      <div className="h-4 w-1/3 bg-slate-200 rounded mb-2" />
      <div className="h-3 w-5/6 bg-slate-100 rounded" />
    </div>
  );

  const ProductsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-12 gap-6 p-4 md:p-6 bg-gradient-to-br from-[#F4F7FF] via-[#F8FAFF] to-[#F2F7FF] rounded-2xl">
      {/* Left */}
      <div className="col-span-12 lg:col-span-8 space-y-4">
        <Card className="p-4 sm:p-5 bg-white/95 border-indigo-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <SectionTitle>{t("quickGenerate.title")}</SectionTitle>
              <SectionHint>
                {t("quickGenerate.syncTooltip")}
              </SectionHint>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={syncFromShopify}
              disabled={!selectedStore || syncing}
              className="flex items-center gap-2 rounded-full hover:bg-indigo-50 text-indigo-700"
              title={t("quickGenerate.syncTooltip")}
            >
              <RefreshCw
                className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
              />
              {t("quickGenerate.sync")}
            </Button>
          </div>

          {/* store / product picker */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1 block text-slate-800">
                {t("quickGenerate.labels.store")}
              </Label>
              {storesLoading ? (
                <div className="h-10 rounded-md bg-slate-100 animate-pulse" />
              ) : (
                <Select
                  value={selectedStore}
                  onValueChange={(v) => {
                    setSelectedStore(v);
                    if (typeof window !== "undefined")
                      localStorage.setItem("storeId", v);
                    setSelectedProduct("");
                  }}
                >
                  <SelectTrigger className="border-slate-200 focus:ring-indigo-200">
                    <SelectValue
                      placeholder={t("quickGenerate.placeholders.chooseStore")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <span className="truncate">{s.shopDomain}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <SectionHint>
                {t("quickGenerate.placeholders.chooseStore")}
              </SectionHint>
            </div>

            <div>
              <Label className="mb-1 block text-slate-800">
                {t("quickGenerate.labels.product")}
              </Label>
              {productsLoading ? (
                <div className="h-10 rounded-md bg-slate-100 animate-pulse" />
              ) : (
                <Select
                  value={selectedProduct}
                  onValueChange={setSelectedProduct}
                  disabled={!products.length}
                >
                  <SelectTrigger className="border-slate-200 focus:ring-indigo-200">
                    <SelectValue
                      placeholder={
                        products.length
                          ? t("quickGenerate.placeholders.chooseProduct")
                          : t("quickGenerate.placeholders.noProducts")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[200px]">
                            {p.title}
                          </span>
                          <Badge color={statusColor[p.status]}>
                            {p.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <SectionHint>{t("recent.noDescription")}</SectionHint>
            </div>

            <div className="md:col-span-2">
              <Label className="mb-1 block text-slate-800">
                {t("quickGenerate.labels.keywords")}
              </Label>
              <Input
                placeholder={t("quickGenerate.placeholders.keywords")}
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="border-slate-200 focus-visible:ring-indigo-200"
                aria-describedby="kw-help"
              />
              <SectionHint>
                <span id="kw-help">
                  {t("labels.tags")} – comma separated for better SEO targeting
                </span>
              </SectionHint>
            </div>

            <div>
              <Label className="mb-1 block text-slate-800">
                {t("quickGenerate.labels.tone")}
              </Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="border-slate-200 focus:ring-indigo-200">
                  <SelectValue placeholder={t("quickGenerate.labels.tone")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neutral">{t("tone.neutral")}</SelectItem>
                  <SelectItem value="friendly">{t("tone.friendly")}</SelectItem>
                  <SelectItem value="professional">
                    {t("tone.professional")}
                  </SelectItem>
                  <SelectItem value="persuasive">
                    {t("tone.persuasive")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleQuickGenerate}
                disabled={!selectedProduct || generating}
                className="w-full md:w-auto bg-[#214D8D] hover:bg-[#1B4176] text-white shadow-sm"
                aria-live="polite"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                    {t("buttons.generating")}
                  </>
                ) : (
                  t("buttons.generate")
                )}
              </Button>
            </div>
          </div>

          {/* Visual guide strip */}
          <div className="mt-4 rounded-xl bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-100 p-3 text-[13px] text-slate-700">
            <ol className="list-decimal list-inside grid gap-1 sm:grid-cols-3">
              <li>{t("quickGenerate.labels.product")} — select a product</li>
              <li>{t("quickGenerate.labels.tone")} — choose a tone</li>
              <li>{t("buttons.generate")} — we’ll create SEO copy</li>
            </ol>
          </div>
        </Card>

        {/* Recent Results */}
        <Card className="p-4 sm:p-5 bg-white/95 border-indigo-100 shadow-sm">
          <SectionTitle>{t("recent.title")}</SectionTitle>
          {recentLoading ? (
            <ProductsSkeleton />
          ) : recentResults.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 bg-white">
              {t("recent.empty")}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentResults.map((r) => (
                <Card
                  key={r.id}
                  className="p-3 flex flex-col justify-between bg-white/95 ring-1 ring-indigo-50 hover:ring-indigo-100 transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3
                          className="font-medium truncate text-slate-900"
                          title={r.title}
                        >
                          {r.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {new Date(r.updatedAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge color={statusColor[r.status]}>{r.status}</Badge>
                    </div>

                    {r.aiDescription ? (
                      <p className="text-sm text-slate-700 line-clamp-4 mt-2">
                        {r.aiDescription}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-500 mt-2">
                        {t("recent.noDescription")}
                      </p>
                    )}

                    {r.aiTags && (
                      <p className="text-xs text-slate-600 mt-2">
                        <span className="font-medium text-slate-700">
                          {t("labels.tags")}
                        </span>{" "}
                        {r.aiTags}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(r.aiDescription || "")}
                      disabled={!r.aiDescription}
                      title={t("tooltips.copyDescription")}
                      className="rounded-full border-slate-300 hover:bg-indigo-50 hover:text-indigo-800"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExpand(r)}
                      className="rounded-full border-slate-300 hover:bg-indigo-50 hover:text-indigo-800"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Right */}
      <div className="col-span-12 lg:col-span-4 space-y-4">
        <Card className="p-4 sm:p-5 bg-white/95 border-indigo-100 shadow-sm">
          <SectionTitle>{t("activity.title")}</SectionTitle>
          <SectionHint>Live log of imports, generations, and edits</SectionHint>
          {activitiesLoading ? (
            <div className="space-y-2 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 w-full bg-slate-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 bg-white mt-2">
              {t("activity.empty")}
            </div>
          ) : (
            <ul className="space-y-2 text-sm max-h-64 overflow-y-auto pr-1 mt-2">
              {activities.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start gap-2 rounded-md hover:bg-indigo-50/60 p-2"
                >
                  <span className="mt-0.5 text-indigo-600">•</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">
                        {a.type}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {a.createdAt
                          ? new Date(a.createdAt).toLocaleString()
                          : ""}
                      </span>
                    </div>
                    <div className="text-slate-700 break-words">
                      {a.message}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">
              {t("modal.title")}
            </DialogTitle>
          </DialogHeader>

          {selectedResult && (
            <div className="space-y-4">
              <div>
                <Label className="mb-1 block text-slate-800">
                  {t("modal.labels.title")}
                </Label>
                <Input value={selectedResult.title} disabled />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label className="mb-1 block text-slate-800">
                    {t("modal.labels.description")}
                  </Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-2 text-indigo-700 hover:bg-indigo-50"
                    onClick={() => handleCopy(editedDescription)}
                    disabled={!editedDescription}
                  >
                    <Copy className="h-4 w-4" /> {t("buttons.copy")}
                  </Button>
                </div>
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  rows={6}
                  placeholder={t("modal.placeholders.description")}
                />
                <SectionHint>120–180 words reads best.</SectionHint>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label className="mb-1 block text-slate-800">
                    {t("modal.labels.meta")}
                  </Label>
                  <span
                    className={`text-xs ${
                      metaLength > 160 ? "text-rose-600" : "text-slate-500"
                    }`}
                    aria-live="polite"
                  >
                    {metaLength}/160
                  </span>
                </div>
                <Textarea
                  value={editedMeta}
                  onChange={(e) => setEditedMeta(e.target.value)}
                  rows={3}
                  placeholder={t("modal.placeholders.meta")}
                />
                <SectionHint>
                  Search engines typically truncate after ~160 characters.
                </SectionHint>
              </div>

              <div>
                <Label className="mb-1 block text-slate-800">
                  {t("modal.labels.tags")}
                </Label>
                <Input
                  value={editedTags}
                  onChange={(e) => setEditedTags(e.target.value)}
                  placeholder={t("modal.placeholders.tags")}
                />
                <SectionHint>Example: “winter, waterproof, lightweight”.</SectionHint>
              </div>

              <div>
                <Label className="mb-1 block text-slate-800">
                  {t("modal.labels.status")}
                </Label>
                <Select
                  value={editedStatus}
                  onValueChange={(v) =>
                    setEditedStatus(v as "draft" | "active" | "published")
                  }
                >
                  <SelectTrigger className="border-slate-200 focus:ring-indigo-200">
                    <SelectValue placeholder={t("modal.placeholders.status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t("status.draft")}</SelectItem>
                    <SelectItem value="active">{t("status.active")}</SelectItem>
                    <SelectItem value="published">
                      {t("status.published")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
              className="border-slate-300 hover:bg-slate-50"
            >
              {t("buttons.cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#214D8D] hover:bg-[#1B4176] text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                  {t("buttons.saving")}
                </>
              ) : (
                t("buttons.save")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
