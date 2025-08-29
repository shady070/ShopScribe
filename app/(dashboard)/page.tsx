"use client";

import { useEffect, useState } from "react";

interface Store {
  id: string;
  shopDomain: string;
  accessToken: string;
  userId: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStores() {
      try {
        // Get JWT from localStorage/session (depends on where you saved it after login)
        const token = localStorage.getItem("jwt");

        if (!token) {
          setError("User not authenticated");
          setLoading(false);
          return;
        }

        // Example: fetch all stores for current user
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/stores`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }

        const data = await res.json();

        if (data.success) {
          setStores(data.data.stores || []);
        } else {
          setError(data.message || "Failed to load stores");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStores();
  }, []);

  if (loading) return <p>Loading stores...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Your Stores</h1>
      {stores.length === 0 ? (
        <p>No stores connected yet.</p>
      ) : (
        <ul className="space-y-2">
          {stores.map((store) => (
            <li
              key={store.id}
              className="border p-3 rounded-md shadow-sm bg-white"
            >
              <p className="font-medium">{store.shopDomain}</p>
              <p className="text-sm text-gray-500">
                Connected on {new Date(store.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
