"use client";

import { useEffect, useState } from "react";
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
import { Copy, Maximize2 } from "lucide-react";

export default function DashboardPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("neutral");
  const [length, setLength] = useState("medium");
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  const [open, setOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [editedFields, setEditedFields] = useState<any>({});
  const [status, setStatus] = useState("draft");

  // 🔹 Get token & shop from localStorage
  const [token, setToken] = useState<string | null>(null);
  const [shopDomain, setShopDomain] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedShop = localStorage.getItem("shopDomain");
    setToken(storedToken);
    setShopDomain(storedShop);
  }, []);

  // ✅ Fetch stores
  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:3001/stores", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const fetchedStores = Array.isArray(data)
          ? data
          : data?.data?.stores || data?.stores || [];
        setStores(fetchedStores);

        if (shopDomain) {
          const matched = fetchedStores.find((s) => s.shopDomain === shopDomain);
          if (matched) setSelectedStore(matched.id);
        } else if (fetchedStores.length > 0) {
          setSelectedStore(fetchedStores[0].id); // fallback first store
        }
      })
      .catch(() => setStores([]));
  }, [token, shopDomain]);

  // ✅ Fetch products, recent results & activities when store changes
  useEffect(() => {
    if (!selectedStore || !token) return;

    // Products
    fetch(`http://localhost:3001/products?storeId=${selectedStore}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setProducts(data?.data?.products || []));

    // Recent results
    fetch(`http://localhost:3001/products/recent?storeId=${selectedStore}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setRecentResults(data?.data || []));

    // Activities
    fetch(`http://localhost:3001/activities?storeId=${selectedStore}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setActivities(data?.data || []));
  }, [selectedStore, token]);

  // ✅ Fetch sync from Shopify (products/fetch)
  useEffect(() => {
    if (!selectedStore || !token) return;

    fetch(`http://localhost:3001/products/fetch?storeId=${selectedStore}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(() => {
        // After fetching from Shopify, refresh products
        return fetch(`http://localhost:3001/products?storeId=${selectedStore}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then((res) => res.json())
      .then((data) => setProducts(data?.data?.products || []))
      .catch((err) => console.error("❌ Products sync failed", err));
  }, [selectedStore, token]);

  // ✅ Quick generate
  const handleQuickGenerate = async () => {
    if (!selectedProduct) return alert("Please select a product");
    if (!token) return alert("No auth token found");

    const res = await fetch("http://localhost:3001/generate/quick", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productId: selectedProduct,
        tone,
        keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
        language: "en",
      }),
    });

    const data = await res.json();
    if (data.success) {
      alert("✅ Quick generation done!");
      fetch(`http://localhost:3001/products/recent?storeId=${selectedStore}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setRecentResults(data.data || []));
    } else {
      alert("❌ Failed: " + data.message);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied!");
  };

  const handleExpand = (result: any) => {
    setSelectedResult(result);
    setEditedFields({
      aiDescriptionA: result.aiDescriptionA || "",
      aiDescriptionB: result.aiDescriptionB || "",
      aiMetaDescriptionA: result.aiMetaDescriptionA || "",
      aiMetaDescriptionB: result.aiMetaDescriptionB || "",
      aiTagsA: result.aiTagsA || "",
      aiTagsB: result.aiTagsB || "",
    });
    setStatus(result.status || "draft");
    setOpen(true);
  };

  const handleSave = async () => {
    if (!selectedResult) return;
    try {
      const res = await fetch(`http://localhost:3001/products/${selectedResult.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...selectedResult, ...editedFields, status }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("✅ Product updated!");
        setOpen(false);
      } else {
        alert("❌ Failed: " + data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 p-6">
      {/* Left side */}
      <div className="col-span-8 space-y-4">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">Quick Generate</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Store Select */}
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger>
                <SelectValue placeholder="Choose Store" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.shopDomain || s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Product Select */}
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Choose Product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Target keywords (comma separated)"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />

            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue placeholder="Tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="persuasive">Persuasive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={length} onValueChange={setLength}>
              <SelectTrigger>
                <SelectValue placeholder="Length" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="long">Long</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleQuickGenerate}>Generate</Button>
          </div>
        </Card>

        {/* Recent Results */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">Recent Results</h2>
          <div className="grid grid-cols-2 gap-4">
            {recentResults.map((r) => (
              <Card key={r.id} className="p-3 flex flex-col justify-between">
                <div>
                  <h3 className="font-medium">{r.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3">{r.aiDescriptionA}</p>
                  {r.aiTagsA && <p className="text-xs text-gray-400 mt-1">Tags: {r.aiTagsA}</p>}
                </div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => handleCopy(r.aiDescriptionA)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleExpand(r)}>
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>

      {/* Right side */}
      <div className="col-span-4 space-y-4">
        <Card className="p-4">
          <h2 className="font-semibold mb-2">Latest Activity</h2>
          <ul className="space-y-2 text-sm">
            {activities.map((a) => (
              <li key={a.id}>
                <span className="font-medium">{a.type}</span> - {a.message}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Expand Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>

          {selectedResult && (
            <div className="space-y-3">
              <Input value={selectedResult.title} disabled />

              <Textarea
                value={editedFields.aiDescriptionA}
                onChange={(e) => setEditedFields({ ...editedFields, aiDescriptionA: e.target.value })}
                rows={4}
                placeholder="AI Description A"
              />
              <Textarea
                value={editedFields.aiDescriptionB}
                onChange={(e) => setEditedFields({ ...editedFields, aiDescriptionB: e.target.value })}
                rows={4}
                placeholder="AI Description B"
              />
              <Textarea
                value={editedFields.aiMetaDescriptionA}
                onChange={(e) => setEditedFields({ ...editedFields, aiMetaDescriptionA: e.target.value })}
                rows={3}
                placeholder="Meta Description A"
              />
              <Textarea
                value={editedFields.aiMetaDescriptionB}
                onChange={(e) => setEditedFields({ ...editedFields, aiMetaDescriptionB: e.target.value })}
                rows={3}
                placeholder="Meta Description B"
              />

              <Input
                value={editedFields.aiTagsA}
                onChange={(e) => setEditedFields({ ...editedFields, aiTagsA: e.target.value })}
                placeholder="Tags A (comma separated)"
              />
              <Input
                value={editedFields.aiTagsB}
                onChange={(e) => setEditedFields({ ...editedFields, aiTagsB: e.target.value })}
                placeholder="Tags B (comma separated)"
              />

              <div>
                <h4 className="text-sm font-semibold mb-1">Status</h4>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
