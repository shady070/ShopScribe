// lib/api.ts
const API = process.env.NEXT_PUBLIC_API_URL!;
let refreshInFlight: Promise<boolean> | null = null;

async function refreshOnce(): Promise<boolean> {
  if (!API) return false;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const tryEndpoints = ['/auth/refresh', '/auth/shopify/session/refresh'];
      for (const ep of tryEndpoints) {
        try {
          const res = await fetch(`${API}${ep}`, {
            method: 'POST',
            credentials: 'include',
          });
          if (res.ok) return true;
        } catch {
          // ignore and try next
        }
      }
      return false;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function apiFetch(path: string, init?: RequestInit) {
  const url = path.startsWith('http') ? path : `${API}${path}`;
  const opts: RequestInit = {
    credentials: 'include',
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  };

  let res = await fetch(url, opts);
  if (res.status === 401) {
    const ok = await refreshOnce();
    if (ok) res = await fetch(url, opts);
  }
  return res;
}
