"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Sparkles,
  History,
  CreditCard,
  Settings,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#F3F2F7] text-slate-800 min-h-dvh">
      {/* Mobile top nav */}
      <MobileTopNav />

      <div className="flex">
        <Sidebar />
        <main className="flex-1 md:ml-72 p-4 md:p-6 xl:p-8">
          {/* Page helper header */}
          <header className="mb-4 md:mb-6">
            <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-100 p-4">
              <h1 className="text-lg md:text-xl font-semibold text-slate-900">ShopScribe</h1>
              <p className="text-sm text-slate-600 mt-1">
                Pick a section from the sidebar, follow the on-screen steps, and keep an eye on the activity feed for what’s happening next.
              </p>
            </div>
          </header>

          {/* Content */}
          <div className="rounded-3xl bg-gradient-to-br from-[#F4F7FF] via-[#F8FAFF] to-[#F2F7FF] p-2 md:p-3">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("sidebar");

  const nav: Array<{ label: string; href: string; icon: React.ElementType; hint?: string }> = [
    { label: t("dashboard"),    href: "/",             icon: LayoutDashboard, hint: "Overview & recent" },
    { label: t("generateCopy"), href: "/generatecopy", icon: Sparkles,        hint: "Create SEO copy" },
    { label: t("billing"),      href: "/billing",      icon: CreditCard,      hint: "Manage plan" },
    { label: t("settings"),     href: "/settings",     icon: Settings,        hint: "Preferences" },
    { label: t("contact"),      href: "/contact",      icon: History,         hint: "Support & history" },
  ];

  return (
    <aside
      className="
        hidden md:flex
        fixed top-6 bottom-6 left-6
        w-64 flex-col
        border border-slate-200
        bg-white rounded-[20px]
        backdrop-blur-xl shadow-sm
      "
      aria-label="Primary"
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-200/70">
        <div className="flex items-center gap-3">
          <div className="rounded-xl overflow-hidden ring-1 ring-slate-200">
            <Image width={44} height={44} src="/logo.png" alt="ShopScribe logo" />
          </div>
          <div>
            <div className="font-semibold text-[#214D8D] leading-tight">ShopScribe</div>
            <div className="text-xs text-slate-500">SEO Copy. Simplified.</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ label, icon: Icon, href, hint }) => {
          // active if exact "/" or current path starts with the href for others
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`group relative w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition border border-transparent
                ${
                  active
                    ? "bg-[#EFF5FF] text-[#214D8D] font-medium border-[#C9DAF8]"
                    : "hover:bg-slate-50 text-slate-600"
                }`}
              aria-current={active ? "page" : undefined}
              title={hint}
            >
              {/* Active indicator bar */}
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full
                  ${active ? "bg-[#214D8D]" : "bg-transparent group-hover:bg-slate-200"}`}
                aria-hidden="true"
              />
              {/* Icon chip */}
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-lg
                ${active ? "bg-[#214D8D] text-white" : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"}`}
              >
                <Icon size={16} />
              </span>
              <span className="flex-1 text-left truncate">{label}</span>
              {active && <span className="h-2 w-2 rounded-full bg-[#214D8D]" aria-hidden="true" />}
            </Link>
          );
        })}
      </nav>

      {/* Helper card */}
      <div className="p-3 mt-auto">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[12px] text-slate-700">
          <div className="font-medium text-slate-800 mb-1">Quick tip</div>
          Sync products, generate copy, then open items to edit and see changes on your shopify store.
        </div>
      </div>
    </aside>
  );
}

/** Compact mobile top nav to show the active tab on small screens */
function MobileTopNav() {
  const pathname = usePathname();
  const t = useTranslations("sidebar");

  const nav: Array<{ label: string; href: string }> = [
    { label: t("dashboard"), href: "/" },
    { label: t("generateCopy"), href: "/generatecopy" },
    { label: t("billing"), href: "/billing" },
    { label: t("settings"), href: "/settings" },
    { label: t("contact"), href: "/contact" },
  ];

  return (
    <div className="md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="px-3 py-2 overflow-x-auto">
        <div className="flex gap-2">
          {nav.map(({ label, href }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm border
                  ${
                    active
                      ? "bg-[#214D8D] text-white border-[#214D8D]"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
