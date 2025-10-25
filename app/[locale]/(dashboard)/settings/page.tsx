"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/use-toast";

type Store = { id: string; shopDomain: string };

type ThemeValue = "system" | "light" | "dark";
type LangCode = "en" | "es" | "fr" | "de" | "it" | "pt" | "nl";

export default function SettingsPage() {
  const t = useTranslations("settings");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // preferences (no profile UI anymore)
  const [theme, setTheme] = useState<ThemeValue>("system");
  const [defaultLanguage, setDefaultLanguage] = useState<LangCode>("en");

  // stores
  const [stores, setStores] = useState<Store[]>([]);
  const [storeLangMap, setStoreLangMap] = useState<Record<string, LangCode>>({});
  const [error, setError] = useState<string | null>(null);

  // option labels
  const THEME_OPTIONS = useMemo(
    () =>
      ([
        { value: "system", label: t("theme.system") },
        { value: "light", label: t("theme.light") },
        { value: "dark", label: t("theme.dark") },
      ] as { value: ThemeValue; label: string }[]),
    [t]
  );

  const LANG_OPTIONS = useMemo(
    () =>
      ([
        { code: "en", label: t("langs.en") },
        { code: "es", label: t("langs.es") },
        { code: "fr", label: t("langs.fr") },
        { code: "de", label: t("langs.de") },
        { code: "it", label: t("langs.it") },
        { code: "pt", label: t("langs.pt") },
        { code: "nl", label: t("langs.nl") },
      ] as { code: LangCode; label: string }[]),
    [t]
  );

  // load settings
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // ----- /settings/me (to get theme + default language)
        const meRes = await apiFetch("/settings/me");
        if (!meRes.ok) throw new Error(t("errors.loadProfile"));
        const meJson = await meRes.json();

        const profile = meJson?.data?.profile ?? meJson?.profile ?? null;
        if (profile) {
          setTheme((profile.theme as ThemeValue) ?? "system");
          setDefaultLanguage((profile.language as LangCode) ?? "en");
        }

        // ----- /stores
        const sRes = await apiFetch("/stores");
        if (!sRes.ok) throw new Error(t("errors.loadStores"));
        const sJson = await sRes.json();
        const fetchedStores: Store[] = Array.isArray(sJson)
          ? sJson
          : sJson?.data?.stores || sJson?.stores || [];
        setStores(fetchedStores || []);

        // ----- /settings/store-preferences
        const pRes = await apiFetch("/settings/store-preferences");
        if (!pRes.ok) throw new Error(t("errors.loadStorePrefs"));
        const pJson = await pRes.json();

        let map = pJson?.data;
        if (Array.isArray(map)) {
          map = Object.fromEntries(map.map((x: any) => [x.storeId, x.language]));
        }
        if (typeof map !== "object" || map === null) map = {};
        setStoreLangMap(map as Record<string, LangCode>);
      } catch (e: any) {
        setError(e?.message || t("errors.loadSettings"));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  // apply theme locally (quick win)
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      setError(null);
      const res = await apiFetch("/settings/profile", {
        method: "PUT",
        body: JSON.stringify({
          language: defaultLanguage,
          theme,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.message || t("errors.saveFailed"));
      }
      toast({ description: t("alerts.profileSaved"), variant: "success" });
    } catch (e: any) {
      setError(e?.message || t("errors.saveFailed"));
      toast({ description: e?.message || t("errors.saveFailed"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateStoreLang = async (storeId: string, language: LangCode) => {
    setStoreLangMap((m) => ({ ...m, [storeId]: language }));
    const res = await apiFetch(`/settings/stores/${storeId}/language`, {
      method: "PUT",
      body: JSON.stringify({ language }),
    });
    if (!res.ok) {
      toast({ description: t("alerts.storeLangFailed"), variant: "destructive" });
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="rounded-2xl border border-indigo-100 p-6 bg-white/70 shadow-sm animate-pulse">
          <div className="h-6 w-40 bg-slate-200 rounded mb-4" />
          <div className="h-10 w-72 bg-slate-200 rounded mb-3" />
          <div className="h-10 w-72 bg-slate-200 rounded" />
        </div>
        <div className="rounded-2xl border border-indigo-100 p-6 bg-white/70 shadow-sm animate-pulse">
          <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
          <div className="h-12 w-full bg-slate-200 rounded mb-2" />
          <div className="h-12 w-full bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      {/* Page header */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-100 p-5">
        <h1 className="text-2xl font-bold text-slate-900">{t("header.title")}</h1>
        <p className="text-sm text-slate-600 mt-1">
          {/* concise helper */}
          Manage your app preferences and per-store language defaults.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 p-3 text-sm">
          {error}
        </div>
      )}

      {/* Preferences (no profile UI) */}
      <Card className="p-6 space-y-6 border-indigo-100 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Preferences</h2>
          <p className="text-sm text-slate-600">
            Choose your theme and default fallback language used across the app.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="mb-1 block">{t("fields.theme")}</Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as ThemeValue)}>
              <SelectTrigger className="border-slate-200 focus:ring-indigo-200">
                <SelectValue placeholder={t("placeholders.theme")} />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1 block">{t("fields.defaultLanguage")}</Label>
            <Select
              value={defaultLanguage}
              onValueChange={(v) => setDefaultLanguage(v as LangCode)}
            >
              <SelectTrigger className="border-slate-200 focus:ring-indigo-200">
                <SelectValue placeholder={t("placeholders.language")} />
              </SelectTrigger>
              <SelectContent>
                {LANG_OPTIONS.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSavePreferences}
            disabled={saving}
            className="bg-[#214D8D] hover:bg-[#1B4176] text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t("buttons.saving")}
              </>
            ) : (
              t("buttons.save")
            )}
          </Button>
        </div>
      </Card>

      {/* Store languages */}
      <Card className="p-6 space-y-6 border-indigo-100 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t("stores.title")}</h2>
          <p className="text-sm text-slate-600">
            Set the preferred <b>generation language</b> per store. This overrides your default.
          </p>
        </div>

        {stores.length === 0 ? (
          <p className="text-sm text-slate-600">{t("stores.empty")}</p>
        ) : (
          <div className="space-y-3">
            {stores.map((s) => {
              const lang = storeLangMap[s.id] || defaultLanguage || "en";
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between border rounded-xl p-3 bg-white/90 border-slate-200"
                >
                  <div className="min-w-0 pr-3">
                    <div className="font-medium text-slate-900 truncate">{s.shopDomain}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {t("stores.storeId")}: {s.id}
                    </div>
                  </div>
                  <div className="w-56">
                    <Select
                      value={lang}
                      onValueChange={(v) => updateStoreLang(s.id, v as LangCode)}
                    >
                      <SelectTrigger className="border-slate-200 focus:ring-indigo-200">
                        <SelectValue placeholder={t("placeholders.language")} />
                      </SelectTrigger>
                      <SelectContent>
                        {LANG_OPTIONS.map((l) => (
                          <SelectItem key={l.code} value={l.code}>
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
