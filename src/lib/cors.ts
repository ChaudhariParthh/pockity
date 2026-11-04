// Browser-safe CORS origin allow-list.
// Kept in a shared module so the server middleware and the client-side
// `fetch` fallback (used when no server function is involved) agree on the
// same origins. Never put secrets here — only public origins.
export const ALLOWED_ORIGINS = [
  "https://pockity.lovable.app",
  "https://pockity.app",
  "https://www.pockity.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
];

/** Returns the request origin if it is allow-listed, otherwise null. */
export function resolveCorsOrigin(requestOrigin: string | null): string | null {
  if (!requestOrigin) return null;
  return ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : null;
}

/** Build CORS headers for a server response. `null` origin = deny. */
export function corsHeaders(origin: string | null, methods = "GET, POST, PUT, DELETE, OPTIONS") {
  return {
    "Access-Control-Allow-Origin": origin ?? "null",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Authorization, Content-Type, apikey, x-client-info",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}