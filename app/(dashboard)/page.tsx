import React from "react";
import { Bell, Search, Settings, ChevronRight, Copy, Download, FileSpreadsheet, ExternalLink, Sparkles, Package, TrendingUp, CheckCircle2, Clock, ShieldCheck, Activity, Plus, Zap, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// NOTE: This is a single-file, production-ready React component you can drop into
// app/(dashboard)/page.tsx in a Next.js App Router project.
// Tailwind CSS is used for styling. shadcn/ui components are used for basics.
// Replace mock data + handlers with your real data fetching and actions.

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 xl:p-8">
          <TopBar />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
            <KpiCard
              title="Credits Remaining"
              value="340 of 500 left"
              delta="-68%"
              chartHint="down"
            />
            <KpiCard
              title="Copies Generated"
              value="1,245 this month"
              delta="+12%"
              chartHint="up"
            />
            <KpiCard
              title="Exported Files"
              value="430 CSV exports."
              delta="+42%"
              chartHint="up"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
            <div className="xl:col-span-2 space-y-6">
              <QuickGenerate />
              <RecentResults />
            </div>
            <div className="xl:col-span-1 space-y-6">
              <PlanStatus />
              <LatestActivity />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Sidebar() {
  const nav = [
    { label: "Dashboard", icon: Activity, active: true },
    { label: "Generate Copy", icon: Sparkles },
    { label: "History", icon: Clock },
    { label: "Billing & Plan", icon: FileSpreadsheet },
    { label: "Settings", icon: Settings },
  ];

  return (
    <aside className="hidden md:flex h-screen sticky top-0 w-64 flex-col border-r border-slate-200 bg-white/60 backdrop-blur-xl">
      <div className="px-5 py-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-600 rounded-xl grid place-items-center text-white shadow-md">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">ShopScribe</div>
            <div className="text-xs text-slate-500">SEO Copy. Simplified.</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ label, icon: Icon, active }) => (
          <button
            key={label}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition hover:bg-slate-100 ${
              active ? "bg-slate-100 text-slate-900" : "text-slate-600"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1 text-left">{label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="text-sm font-medium">Pro Plan</div>
            <div className="text-xs text-slate-500">Active subscription</div>
            <div className="mt-3 flex items-center gap-2">
              <Button className="rounded-2xl" size="sm" variant="secondary">Manage</Button>
              <Button className="rounded-2xl" size="sm">Upgrade</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <div className="flex items-center gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Welcome to <span className="font-medium">ShopScribe</span>. Boost your store with ready‑to‑publish product copy.
        </p>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input className="pl-9 w-64 rounded-2xl" placeholder="Search here..." />
        </div>
        <Button variant="ghost" size="icon" className="rounded-2xl">
          <Bell className="h-5 w-5" />
        </Button>
        <div className="h-9 w-9 rounded-2xl bg-slate-300" />
      </div>
    </div>
  );
}

function KpiCard({ title, value, delta, chartHint }: { title: string; value: string; delta: string; chartHint: "up" | "down"; }) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-slate-500 font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-end justify-between">
          <div className="text-xl font-semibold">{value}</div>
          <TrendingGlyph dir={chartHint} />
        </div>
        <div className={`mt-1 text-xs ${delta.startsWith("+") ? "text-emerald-600" : "text-rose-600"}`}>{delta}</div>
      </CardContent>
    </Card>
  );
}

function TrendingGlyph({ dir }: { dir: "up" | "down" }) {
  return (
    <div className="h-10 w-20 rounded-md bg-gradient-to-b from-slate-100 to-slate-50 border border-slate-200 grid place-items-center">
      {dir === "up" ? <TrendingUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5 rotate-180" />}
    </div>
  );
}

function QuickGenerate() {
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg">Quick Generate</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Input placeholder="Product Name" className="h-12 rounded-xl bg-slate-100/70 border-slate-200" />
          <Input placeholder="Target Keywords" className="h-12 rounded-xl bg-slate-100/70 border-slate-200" />
          <div className="pt-2">
            <Button className="rounded-xl">Generate</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentResults() {
  const items = [
    {
      title: "Eco Bamboo Dining Table",
      excerpt:
        "Crafted from sustainably sourced bamboo, this dining table brings both style...",
      tone: "Calm",
    },
    {
      title: "Eco Bamboo Dining Table",
      excerpt:
        "Crafted from sustainably sourced bamboo, this dining table brings both style...",
      tone: "Balanced",
    },
    {
      title: "Eco Bamboo Dining Table",
      excerpt:
        "Crafted from sustainably sourced bamboo, this dining table brings both style...",
      tone: "Upbeat",
    },
  ];

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg">Recent Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it, i) => (
            <ResultCard key={i} {...it} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ResultCard({ title, excerpt, tone }: { title: string; excerpt: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold">{title}</div>
      <p className="mt-2 text-sm text-slate-600 line-clamp-3">{excerpt}</p>
      <div className="mt-4 flex items-center justify-between text-slate-500">
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="secondary" className="rounded-2xl">{tone}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <IconButton title="Copy">
            <Copy className="h-4 w-4" />
          </IconButton>
          <IconButton title="Download">
            <Download className="h-4 w-4" />
          </IconButton>
          <IconButton title="Open">
            <ExternalLink className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

function PlanStatus() {
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg">Plan Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-slate-500">Track usage and manage your plan.</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="text-sm font-medium">Pro Plan</div>
              <Badge className="rounded-2xl bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Active</Badge>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium">Renewal Date</div>
            <div className="text-xs text-slate-500">Renews on Aug 30, 2025</div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Usage Summary</div>
            <div className="h-2 w-full bg-slate-200 rounded-full">
              <div className="h-2 bg-indigo-600 rounded-full" style={{ width: "68%" }} />
            </div>
            <div className="mt-2 text-xs text-slate-500">Credits: 340 / 500</div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button variant="secondary" className="rounded-2xl">Manage Plan</Button>
            <Button className="rounded-2xl">Upgrade</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LatestActivity() {
  const items = [
    {
      title: 'Generated SEO copy for "Eco Bamboo Dining Table"',
      time: "Aug 23, 3:45 PM",
    },
    {
      title: "Exported CSV with 12 product descriptions",
      time: "Aug 23, 2:10 PM",
    },
    {
      title: 'Generated copy for "Super-Soft Memory Foam Pillow"',
      time: "Aug 22, 9:30 PM",
    },
  ];

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg">Latest Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px] pr-2">
          <ol className="relative border-l border-slate-200 ml-2">
            {items.map((it, i) => (
              <li key={i} className="ml-4 mb-6">
                <span className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-indigo-600" />
                <div className="text-sm font-medium">{it.title}</div>
                <div className="text-xs text-slate-500">{it.time}</div>
              </li>
            ))}
          </ol>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function IconButton({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <button
      title={title}
      className="grid place-items-center h-8 w-8 rounded-lg border border-slate-200 hover:bg-slate-50"
      onClick={() => { /* wire up */ }}
    >
      {children}
    </button>
  );
}
