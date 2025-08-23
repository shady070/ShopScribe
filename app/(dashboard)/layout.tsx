import React from "react";

// This layout wraps all dashboard pages. You can drop it in app/(dashboard)/layout.tsx
// It includes the Sidebar and a consistent page structure.

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 xl:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function Sidebar() {
  const nav = [
    { label: "Dashboard", icon: "📊", href: "/" },
    { label: "Generate Copy", icon: "✨", href: "/generatecopy" },
    { label: "History", icon: "🕒", href: "/history" },
    { label: "Billing & Plan", icon: "💳", href: "/billing" },
    { label: "Settings", icon: "⚙️", href: "/settings" },
  ];

  return (
    <aside className="hidden md:flex h-screen sticky top-0 w-64 flex-col border-r border-slate-200 bg-white/60 backdrop-blur-xl">
      <div className="px-5 py-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-600 rounded-xl grid place-items-center text-white shadow-md">
            🛍️
          </div>
          <div>
            <div className="font-semibold">ShopScribe</div>
            <div className="text-xs text-slate-500">SEO Copy. Simplified.</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ label, icon, href }) => (
          <a
            key={label}
            href={href}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition hover:bg-slate-100 text-slate-600"
          >
            <span>{icon}</span>
            <span className="flex-1 text-left">{label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
