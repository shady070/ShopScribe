"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
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
} from "@/components/ui/dialog";

interface Product {
  id: string;
  title: string;
  status: "not_created" | "generating" | "done" | "failed";
  updatedAt: string;
}

interface Store {
  id: string;
  shopDomain: string;
}

const PAGE_SIZE = 10;

const GeneratePage = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingProducts, setLoadingProducts] = useState<string[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  // 🔹 Token & shop handling
  const urlParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const urlToken = urlParams.get("token");
  const urlShop = urlParams.get("shop");
  const localToken =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  const token = urlToken || localToken;

  useEffect(() => {
    if (urlToken) localStorage.setItem("authToken", urlToken);
    if (urlShop) localStorage.setItem("shopDomain", urlShop);
  }, [urlToken, urlShop]);

  // 🔹 Fetch stores
  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:3001/stores", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const fetchedStores: Store[] = Array.isArray(data)
          ? data
          : data?.data?.stores || data?.stores || [];
        setStores(fetchedStores);

        let activeStore: Store | undefined;
        if (urlShop) {
          activeStore = fetchedStores.find((s) => s.shopDomain === urlShop);
        }
        if (!activeStore && fetchedStores.length > 0) {
          activeStore = fetchedStores[0];
        }

        if (activeStore) {
          setSelectedStore(activeStore.id);
          localStorage.setItem("storeId", activeStore.id);
        }
      })
      .catch(() => setStores([]));
  }, [token, urlShop]);

  // 🔹 Fetch products
  const fetchProducts = async (page: number) => {
    if (!token || !selectedStore) return;

    try {
      const res = await fetch(
        `http://localhost:3001/products?storeId=${selectedStore}&page=${page}&limit=${PAGE_SIZE}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Store-Id": selectedStore, // ✅ Add storeId header
          },
        }
      );
      const data = await res.json();
      setProducts(data.data?.products || []);
      setHasNextPage(data.data?.hasNextPage || false);
      setTotalPages(data.data?.totalPages || 1);
    } catch (err) {
      console.error(err);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchProducts(page);
  }, [page, token, selectedStore]);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (selected.length === 0) return alert("Select at least one product.");
    if (!token || !selectedStore)
      return alert("No auth token or store selected");

    try {
      setLoadingProducts(selected);
      setProducts((prev) =>
        prev.map((p) =>
          selected.includes(p.id) ? { ...p, status: "generating" } : p
        )
      );

      const res = await fetch("http://localhost:3001/generate/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Store-Id": selectedStore, // ✅ Added storeId header for guard
        },
        body: JSON.stringify({ productIds: selected }),
      });

      const data = await res.json();

      if (data.success) {
        setProducts((prev) =>
          prev.map((p) =>
            selected.includes(p.id) ? { ...p, status: "done" } : p
          )
        );
        setSelected([]);
      } else {
        setProducts((prev) =>
          prev.map((p) =>
            selected.includes(p.id) ? { ...p, status: "failed" } : p
          )
        );
        alert(data.message || "Generation failed");
      }
    } catch (err) {
      console.error(err);
      setProducts((prev) =>
        prev.map((p) =>
          selected.includes(p.id) ? { ...p, status: "failed" } : p
        )
      );
    } finally {
      setLoadingProducts([]);
    }
  };

  const renderStatus = (status: Product["status"], id: string) => {
    if (loadingProducts.includes(id) || status === "generating") {
      return (
        <span className="flex items-center text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin mr-1" /> Generating...
        </span>
      );
    }
    if (status === "done") {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-200 text-green-700">
          ✅ Created
        </span>
      );
    }
    if (status === "failed") {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-200 text-red-700">
          ❌ Failed
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
        Not Created
      </span>
    );
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Bulk Generate</h1>

      {/* Store Select */}
      <Select value={selectedStore} onValueChange={setSelectedStore}>
        <SelectTrigger>
          <SelectValue placeholder="Select Store" />
        </SelectTrigger>
        <SelectContent>
          {stores.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.shopDomain}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Table className="mt-4">
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated On</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6">
                No products found
              </TableCell>
            </TableRow>
          ) : (
            products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Checkbox
                    checked={selected.includes(p.id)}
                    onCheckedChange={() => toggleSelect(p.id)}
                    disabled={loadingProducts.includes(p.id)}
                  />
                </TableCell>
                <TableCell>
                  <button
                    className="text-blue-600 underline"
                    onClick={() => {
                      setModalProduct(p);
                      setOpenModal(true);
                    }}
                  >
                    {p.title}
                  </button>
                </TableCell>
                <TableCell>{renderStatus(p.status, p.id)}</TableCell>
                <TableCell>
                  {new Date(p.updatedAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <Button
          variant="outline"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasNextPage}
        >
          Next
        </Button>
      </div>

      {/* Bulk Generate */}
      <Button
        onClick={handleGenerate}
        disabled={selected.length === 0 || loadingProducts.length > 0}
        className="mt-4"
      >
        {loadingProducts.length > 0 ? "Generating..." : "Generate Selected"}
      </Button>

      {/* 🔹 Modal for product details */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {modalProduct ? (
            <div className="space-y-2">
              <p>
                <strong>ID:</strong> {modalProduct.id}
              </p>
              <p>
                <strong>Title:</strong> {modalProduct.title}
              </p>
              <p>
                <strong>Status:</strong> {modalProduct.status}
              </p>
              <p>
                <strong>Updated At:</strong>{" "}
                {new Date(modalProduct.updatedAt).toLocaleString()}
              </p>
            </div>
          ) : (
            <p>No product selected.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GeneratePage;
