"use client";

import { useEffect, useMemo, useState } from "react";
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

type Store = { id: string; shopDomain: string };
type Product = {
  id: string;
  title: string;
  status: "idle" | "generating" | "done" | "failed" | "active" | "draft" | "published";
  updatedAt: string;
  aiDescription?: string | null;
  aiMetaDescription?: string | null;
  aiTags?: string | null;
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
  const [editedStatus, setEditedStatus] = useState<"draft" | "active" | "published">("draft");
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
        const preferred = typeof window !== "undefined" ? localStorage.getItem("storeId") : null;
        let next = fetchedStores[0]?.id || "";
        if (preferred && fetchedStores.some((s) => s.id === preferred)) next = preferred;

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

  useEffect(() => {
    if (!selectedStore) return;
    // fire and forget
    syncFromShopify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore]);

  // ---------- quick generate ----------
  const handleQuickGenerate = async () => {
    if (!selectedProduct) return alert(t("alerts.selectProduct"));
    try {
      setGenerating(true);
      const res = await apiFetch("/generate/quick", {
        method: "POST",
        body: JSON.stringify({
          productId: selectedProduct,
          tone,
          keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
          // ❌ no language here: backend picks store/user preference
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(t("alerts.quickSuccess"));
        // refresh recent list
        const rr = await apiFetch(`/products/recent?storeId=${selectedStore}`);
        const rdata = await rr.json();
        setRecentResults(rdata.data || []);
        // refresh products to update status
        const pr = await apiFetch(`/products?storeId=${selectedStore}`);
        const pdata = await pr.json();
        setProducts(pdata?.data?.products || []);
      } else {
        alert(t("alerts.quickFail", { message: data.message || t("errors.generic") }));
      }
    } catch (err: any) {
      alert(t("alerts.quickFail", { message: err?.message || t("errors.generic") }));
    } finally {
      setGenerating(false);
    }
  };

  // ---------- copy ----------
  const handleCopy = (text?: string | null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert(t("alerts.copied"));
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
        alert(t("alerts.productUpdated"));
        setOpen(false);
        // refresh recent/products
        loadStoreData(selectedStore);
      } else {
        alert(t("alerts.updateFail", { message: data.message || t("errors.generic") }));
      }
    } catch (err: any) {
      alert(t("alerts.updateFail", { message: err?.message || t("errors.generic") }));
    } finally {
      setSaving(false);
    }
  };

  // ---------- UI bits ----------
  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-lg font-semibold mb-2">{children}</h2>
  );

  const SkeletonRow = () => (
    <div className="rounded-lg border p-3 animate-pulse">
      <div className="h-4 w-1/3 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-5/6 bg-gray-200 rounded" />
    </div>
  );

  const ProductsSkeleton = () => (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-12 gap-6 p-6">
      {/* Left */}
      <div className="col-span-8 space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <SectionTitle>{t("quickGenerate.title")}</SectionTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={syncFromShopify}
              disabled={!selectedStore || syncing}
              className="flex items-center gap-2"
              title={t("quickGenerate.syncTooltip")}
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {t("quickGenerate.sync")}
            </Button>
          </div>

          {/* store / product picker */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1 block">{t("quickGenerate.labels.store")}</Label>
              {storesLoading ? (
                <div className="h-10 rounded-md bg-gray-100 animate-pulse" />
              ) : (
                <Select
                  value={selectedStore}
                  onValueChange={(v) => {
                    setSelectedStore(v);
                    if (typeof window !== "undefined") localStorage.setItem("storeId", v);
                    setSelectedProduct("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("quickGenerate.placeholders.chooseStore")} />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.shopDomain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label className="mb-1 block">{t("quickGenerate.labels.product")}</Label>
              {productsLoading ? (
                <div className="h-10 rounded-md bg-gray-100 animate-pulse" />
              ) : (
                <Select
                  value={selectedProduct}
                  onValueChange={setSelectedProduct}
                  disabled={!products.length}
                >
                  <SelectTrigger>
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
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="col-span-2">
              <Label className="mb-1 block">{t("quickGenerate.labels.keywords")}</Label>
              <Input
                placeholder={t("quickGenerate.placeholders.keywords")}
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>

            <div>
              <Label className="mb-1 block">{t("quickGenerate.labels.tone")}</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue placeholder={t("quickGenerate.labels.tone")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neutral">{t("tone.neutral")}</SelectItem>
                  <SelectItem value="friendly">{t("tone.friendly")}</SelectItem>
                  <SelectItem value="professional">{t("tone.professional")}</SelectItem>
                  <SelectItem value="persuasive">{t("tone.persuasive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleQuickGenerate} disabled={!selectedProduct || generating}>
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> {t("buttons.generating")}
                  </>
                ) : (
                  t("buttons.generate")
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Recent Results */}
        <Card className="p-4">
          <SectionTitle>{t("recent.title")}</SectionTitle>
          {recentLoading ? (
            <ProductsSkeleton />
          ) : recentResults.length === 0 ? (
            <p className="text-sm text-gray-500">{t("recent.empty")}</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {recentResults.map((r) => (
                <Card key={r.id} className="p-3 flex flex-col justify-between">
                  <div>
                    <h3 className="font-medium">{r.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(r.updatedAt).toLocaleString()}
                    </p>

                    {r.aiDescription ? (
                      <p className="text-sm text-gray-700 line-clamp-4 mt-2">
                        {r.aiDescription}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 mt-2">{t("recent.noDescription")}</p>
                    )}

                    {r.aiTags && (
                      <p className="text-xs text-gray-400 mt-2">
                        <span className="font-medium text-gray-500">{t("labels.tags")}</span>{" "}
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
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleExpand(r)}>
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
      <div className="col-span-4 space-y-4">
        <Card className="p-4">
          <SectionTitle>{t("activity.title")}</SectionTitle>
          {activitiesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <p className="text-sm text-gray-500">{t("activity.empty")}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {activities.map((a) => (
                <li key={a.id}>
                  <span className="font-medium">{a.type}</span> — {a.message}
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
            <DialogTitle>{t("modal.title")}</DialogTitle>
          </DialogHeader>

          {selectedResult && (
            <div className="space-y-4">
              <div>
                <Label className="mb-1 block">{t("modal.labels.title")}</Label>
                <Input value={selectedResult.title} disabled />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label className="mb-1 block">{t("modal.labels.description")}</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-2"
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
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label className="mb-1 block">{t("modal.labels.meta")}</Label>
                  <span className={`text-xs ${metaLength > 160 ? "text-red-600" : "text-gray-500"}`}>
                    {metaLength}/160
                  </span>
                </div>
                <Textarea
                  value={editedMeta}
                  onChange={(e) => setEditedMeta(e.target.value)}
                  rows={3}
                  placeholder={t("modal.placeholders.meta")}
                />
              </div>

              <div>
                <Label className="mb-1 block">{t("modal.labels.tags")}</Label>
                <Input
                  value={editedTags}
                  onChange={(e) => setEditedTags(e.target.value)}
                  placeholder={t("modal.placeholders.tags")}
                />
              </div>

              <div>
                <Label className="mb-1 block">{t("modal.labels.status")}</Label>
                <Select
                  value={editedStatus}
                  onValueChange={(v) => setEditedStatus(v as "draft" | "active" | "published")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("modal.placeholders.status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t("status.draft")}</SelectItem>
                    <SelectItem value="active">{t("status.active")}</SelectItem>
                    <SelectItem value="published">{t("status.published")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              {t("buttons.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> {t("buttons.saving")}
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
