"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  token: string | null;
  setToken: (t: string | null) => void;
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  setToken: () => {},
  refreshToken: async () => null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);

  // 🔹 Initial token from Shopify callback query param
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const t = urlParams.get("token");
    if (t) setToken(t);
  }, []);

    async function refreshToken() {
        const res = await fetch('http://localhost:3001/auth/shopify/session/refresh', {
          method: 'POST',
          credentials: 'include', // ✅ important
        });
      
        if (!res.ok) throw new Error('Unauthorized');
        const data = await res.json();
        return data.accessToken;
      }
      

  return (
    <AuthContext.Provider value={{ token, setToken, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
