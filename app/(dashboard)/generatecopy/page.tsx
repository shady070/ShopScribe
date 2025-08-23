"use client";

import React from "react";
import { Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function GeneratePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="flex">
        <main className="flex-1 p-6 xl:p-8">
          <TopBar />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
            <div className="xl:col-span-2 space-y-6">
              <ActionTip />
              <GenerateForm />
            </div>
            <div className="xl:col-span-1">
              <RecentCopies />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


function TopBar() {
  return (
    <div className="flex items-center gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Generate Copy</h1>
        <p className="text-sm text-slate-500">
          Create <span className="font-medium">SEO‑ready</span> product descriptions in seconds.
        </p>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input className="pl-9 w-64 rounded-2xl" placeholder="Search here..." />
        </div>
        <div className="h-9 w-9 rounded-2xl bg-slate-300" />
      </div>
    </div>
  );
}

function ActionTip() {
  return (
    <Card className="border-slate-200 bg-emerald-50/60">
      <CardContent className="p-4">
        <div className="text-sm font-medium">Action tip</div>
        <p className="text-sm text-slate-600 mt-1">
          Paste product info or upload CSV for bulk generation.
        </p>
      </CardContent>
    </Card>
  );
}

function GenerateForm() {
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg">Generate Copy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input placeholder="Product Name" className="h-12 rounded-xl bg-slate-100/70 border-slate-200" />
          <Input placeholder="Price" className="h-12 rounded-xl bg-slate-100/70 border-slate-200" />
          <Input placeholder="Features / Attributes" className="h-12 rounded-xl bg-slate-100/70 border-slate-200" />
          <Input placeholder="Target Keywords" className="h-12 rounded-xl bg-slate-100/70 border-slate-200" />

          <Select>
            <SelectTrigger className="h-12 rounded-xl bg-slate-100/70 border-slate-200">
              <SelectValue placeholder="Tone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="luxury">Luxury</SelectItem>
              <SelectItem value="minimal">Minimal</SelectItem>
              <SelectItem value="playful">Playful</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="h-12 rounded-xl bg-slate-100/70 border-slate-200">
              <SelectValue placeholder="Length" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short">Short</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="long">Long</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button variant="secondary" className="rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-200">
            <Upload className="h-4 w-4 mr-2" /> Upload CSV
          </Button>
          <Button className="rounded-xl">Generate</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentCopies() {
  const items = [
    "Eco Bamboo Dining Table",
    "Memory Foam Pillow",
    "Eco Bamboo Dining Table",
    "Eco Bamboo Dining Table",
    "Eco Bamboo Dining Table",
    "Eco Bamboo Dining Table",
    "Eco Bamboo Dining Table",
    "Eco Bamboo Dining Table",
    "Eco Bamboo Dining Table",
  ];

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg">Recent Copies</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div
              key={i}
              className={`px-3 py-2 rounded-xl text-sm cursor-pointer transition ${
                i === 0
                  ? "bg-indigo-100 text-indigo-800 font-medium"
                  : "bg-amber-100 text-amber-800 hover:bg-amber-200"
              }`}
            >
              {item}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
