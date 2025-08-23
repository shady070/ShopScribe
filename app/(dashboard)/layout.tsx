"use client";

import React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
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

  const nav = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "Generate Copy", icon: Sparkles, href: "/generatecopy" },
    { label: "History", icon: History, href: "/history" },
    { label: "Billing & Plan", icon: CreditCard, href: "/billing" },
    { label: "Settings", icon: Settings, href: "/settings" },
  ];

  return (
    <aside
      className="
        hidden md:flex 
        fixed top-6 bottom-6   /* gap from top & bottom */
        left-6                /* optional gap from left */
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
            <Image width={50} height={50} src={"/logo.png"} alt={"Logo"} />
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
          const active = pathname === href;
          return (
            <a
              key={label}
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
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
