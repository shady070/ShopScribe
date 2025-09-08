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
    <div className="bg-[#F3F2F7] text-slate-800 flex">
      <Sidebar />
      <main className="flex-1 ml-72 p-6 xl:p-8">{children}</main>
    </div>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("sidebar");

  const nav: Array<{ label: string; href: string; icon: React.ElementType }> = [
    { label: t("dashboard"),    href: "/",             icon: LayoutDashboard },
    { label: t("generateCopy"), href: "/generatecopy", icon: Sparkles },
    { label: t("contact"),      href: "/contact",      icon: History },
    { label: t("billing"),      href: "/billing",      icon: CreditCard },
    { label: t("settings"),     href: "/settings",     icon: Settings },
  ];

  return (
    <aside
      className="
        hidden md:flex 
        fixed top-6 bottom-6
        left-6
        w-64 flex-col 
        border-r border-slate-200 
        bg-white rounded-[20px] 
        backdrop-blur-xl
      "
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="rounded-xl">
            <Image width={50} height={50} src="/logo.png" alt="Logo" />
          </div>
          <div>
            <div className="font-semibold text-[#214D8D]">ShopScribe</div>
            <div className="text-xs text-slate-500">SEO Copy. Simplified.</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ label, icon: Icon, href }) => {
          // active if exact "/" or current path starts with the href for others
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`w-full flex items-center gap-3 rounded-full px-3 py-2 text-sm transition 
                ${
                  active
                    ? "bg-[#789ED763] text-[#214D8D] font-medium"
                    : "hover:bg-slate-100 text-slate-600"
                }`}
            >
              <Icon size={18} />
              <span className="flex-1 text-left">{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
