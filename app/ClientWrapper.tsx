"use client";

import { useEffect } from "react";

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    const urlShop = urlParams.get("shop");

    if (urlToken) {
      localStorage.setItem("authToken", urlToken);
    }
    if (urlShop) {
      localStorage.setItem("shopDomain", urlShop);
    }
  }, []);

  return <>{children}</>;
}
