"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
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
import { Loader2, UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";

type Store = { id: string; shopDomain: string };

type ThemeValue = "system" | "light" | "dark";
type LangCode = "en" | "es" | "fr" | "de" | "it" | "pt" | "nl";

export default function SettingsPage() {
  const t = useTranslations("settings");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeValue>("system");
  const [defaultLanguage, setDefaultLanguage] = useState<LangCode>("en");

  const [stores, setStores] = useState<Store[]>([]);
  // storeId -> language code
  const [storeLangMap, setStoreLangMap] = useState<Record<string, LangCode>>({});
  const [error, setError] = useState<string | null>(null);

  // Theme & language option labels from translations
  const THEME_OPTIONS = useMemo(
    () => ([
      { value: "system", label: t("theme.system") },
      { value: "light", label: t("theme.light") },
      { value: "dark",  label: t("theme.dark")  },
    ] as { value: ThemeValue; label: string }[]),
    [t]
  );

  const LANG_OPTIONS = useMemo(
    () => ([
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

        // ----- /settings/me
        const meRes = await apiFetch("/settings/me");
        if (!meRes.ok) throw new Error(t("errors.loadProfile"));
        const meJson = await meRes.json();

        const userEmail =
          meJson?.data?.user?.email ??
          meJson?.data?.email ??
          meJson?.email ??
          "";

        const profile =
          meJson?.data?.profile ??
          meJson?.profile ??
          null;

        setEmail(userEmail);
        if (profile) {
          setAvatarUrl(profile.avatarUrl ?? null);
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
          map = Object.fromEntries(
            map.map((x: any) => [x.storeId, x.language])
          );
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
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark"); // light OR system -> remove
    }
  }, [theme]);

  const handleAvatarUpload = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await apiFetch("/settings/avatar", { method: "POST", body: form });
    const data = await res.json();
    if (res.ok && data.avatarUrl) {
      setAvatarUrl(data.avatarUrl);
    } else {
      alert(data?.message || t("alerts.uploadFailed"));
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      const res = await apiFetch("/settings/profile", {
        method: "PUT",
        body: JSON.stringify({
          language: defaultLanguage,
          theme,
          avatarUrl: avatarUrl || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.message || t("errors.saveFailed"));
      }
      alert(t("alerts.profileSaved"));
    } catch (e: any) {
      setError(e?.message || t("errors.saveFailed"));
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
      alert(t("alerts.storeLangFailed"));
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="p-6 space-y-4 animate-pulse">
          <div className="h-6 w-40 bg-gray-200 rounded" />
          <div className="h-20 w-full bg-gray-200 rounded" />
          <div className="h-10 w-48 bg-gray-200 rounded" />
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">{t("header.title")}</h1>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
          {error}
        </div>
      )}

      {/* Profile */}
      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">{t("profile.title")}</h2>
          <p className="text-sm text-gray-500">{t("profile.subtitle")}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gray-100">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={t("profile.avatarAlt")} fill className="object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
                {t("profile.noAvatar")}
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="avatar" className="mb-1 block">{t("profile.changeAvatar")}</Label>
            <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer">
              <UploadCloud className="h-4 w-4" />
              <span>{t("profile.upload")}</span>
              <input
                id="avatar"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatarUpload(f);
                }}
              />
            </label>
          </div>
        </div>

        <div>
          <Label className="mb-1 block">{t("fields.email")}</Label>
          <Input value={email} disabled />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="mb-1 block">{t("fields.theme")}</Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as ThemeValue)}>
              <SelectTrigger>
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
            <Select value={defaultLanguage} onValueChange={(v) => setDefaultLanguage(v as LangCode)}>
              <SelectTrigger>
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
          <Button onClick={handleSaveProfile} disabled={saving}>
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
      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">{t("stores.title")}</h2>
        </div>

        {stores.length === 0 ? (
          <p className="text-sm text-gray-500">{t("stores.empty")}</p>
        ) : (
          <div className="space-y-3">
            {stores.map((s) => {
              const lang = storeLangMap[s.id] || defaultLanguage || "en";
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between border rounded-md p-3"
                >
                  <div>
                    <div className="font-medium">{s.shopDomain}</div>
                    <div className="text-xs text-gray-500">
                      {t("stores.storeId")}: {s.id}
                    </div>
                  </div>
                  <div className="w-56">
                    <Select
                      value={lang}
                      onValueChange={(v) => updateStoreLang(s.id, v as LangCode)}
                    >
                      <SelectTrigger>
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
