// apps/web/app/login/page.tsx
"use client";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function LoginPage() {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("pass1234");

  const doLogin = async () => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      credentials: "include",                 // <-- IMPORTANT
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return alert("Login failed");
    window.location.href = "/dashboard";
  };

  return (
    <div className="max-w-sm mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-bold">Login</h1>
      <input className="border rounded p-2 w-full" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" />
      <input className="border rounded p-2 w-full" value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" type="password" />
      <button className="bg-black text-white rounded px-4 py-2" onClick={doLogin}>Login</button>
    </div>
  );
}
