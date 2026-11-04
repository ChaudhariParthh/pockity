import { z } from "zod";
import { isValidCategory } from "@/lib/categorization";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Invalid date");
const fields = {
  description: z.string().max(100).trim().min(1),
  amount: z.number().finite().positive().max(1e9).refine((value) => Math.round(value * 100) > 0, "Invalid amount"),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1).max(100),
  date: dateSchema,
};
export const transactionSchema = z.object(fields).strict().refine((t) => isValidCategory(t.category, t.type), "Invalid category");
export const transactionUpdateSchema = z.object({ ...fields }).partial().extend({ id: z.string().uuid() }).strict().refine((t) => {
  if (Object.keys(t).length < 2) return false;
  if (t.category === undefined) return true;
  return t.type ? isValidCategory(t.category, t.type, true) : isValidCategory(t.category, "expense", true) || isValidCategory(t.category, "income", true);
}, "Invalid transaction");
export const transactionIdSchema = z.string().uuid();

const destinations = new Set(["/dashboard", "/transactions", "/analytics", "/settings", "/upgrade"]);
export function safeRedirect(path: unknown): string {
  return typeof path === "string" && destinations.has(path) ? path : "/dashboard";
}

/** Quoting alone does not prevent a spreadsheet interpreting a cell as a formula. */
export function csvCell(value: unknown): string {
  let text = String(value);
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** Identity changes must cancel requests before discarding private cached data. */
export function clearPrivateCache(cache: { cancelQueries: () => Promise<unknown>; clear: () => void }) {
  const cancelled = cache.cancelQueries();
  cache.clear();
  return cancelled;
}

export function secureResponse(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);

  // SECURITY HEADERS
  // Prevent MIME type sniffing attacks
  headers.set("X-Content-Type-Options", "nosniff");
  // Prevent clickjacking attacks
  const requestUrl = new URL(request.url);
  const editorPreview = requestUrl.hostname === "localhost" || /^id-preview(?:-[a-z0-9]+)?--[0-9a-f-]{36}\.lovable\.app$/.test(requestUrl.hostname);
  if (editorPreview) headers.delete("X-Frame-Options");
  else headers.set("X-Frame-Options", "DENY");
  // Reduce referrer information leakage
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // XSS Protection (legacy browsers)
  headers.set("X-XSS-Protection", "1; mode=block");
  // Permissions Policy - restrict browser features
  headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=()");

  // Content Security Policy
  // In development, Vite uses inline scripts and dynamic imports (HMR, dev server),
  // so we relax the script-src to allow them. In production, strict CSP is enforced.
  // Both environments need connect-src for Supabase API calls and font-src for Google Fonts.
  const isDev = typeof process !== 'undefined' && process.env['NODE_ENV'] !== 'production';
  // Use the same public backend origin as the browser client, never a stale
  // project URL or a wildcard that would permit arbitrary data destinations.
  const backendUrl = import.meta.env.VITE_SUPABASE_URL;
  const connections = ["'self'"];
  if (backendUrl) {
    const backend = new URL(backendUrl);
    if (backend.protocol === "https:" || (isDev && backend.protocol === "http:")) {
      connections.push(backend.origin);
    }
  }
  if (isDev) connections.push("ws://localhost:*", "ws://127.0.0.1:*");
  const connectSrc = connections.join(" ");
  const csp = isDev
    ? "base-uri 'self'; object-src 'none'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; connect-src " + connectSrc + "; font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com; img-src 'self' data: https:;"
    // TanStack Router SSR injects inline <script> tags for hydration data
    // (data-tsr-stream-part / window.$_TSR) and the root route injects an inline
    // theme-init script. Without 'unsafe-inline' the browser blocks them, so
    // client hydration never starts and the page renders blank.
    : "base-uri 'self'; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; connect-src " + connectSrc + "; font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com; img-src 'self' data: https:;";
  headers.set("Content-Security-Policy", csp + (editorPreview ? " frame-ancestors https://lovable.dev https://*.lovable.dev;" : " frame-ancestors 'none';"));

  // HTTPS-only hosts should always use HSTS
  if (new URL(request.url).protocol === "https:") headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  // Prevent caching of sensitive content
  const contentType = headers.get("content-type")?.toLowerCase() || "";
  if (contentType.includes("text/html") || new URL(request.url).pathname.startsWith("/_serverFn") || contentType.includes("application/json")) {
    headers.set("Cache-Control", "private, no-store, no-cache, must-revalidate");
    headers.set("Pragma", "no-cache");
  }

  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}