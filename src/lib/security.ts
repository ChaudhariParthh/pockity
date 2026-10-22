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
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Content-Security-Policy", "base-uri 'self'; object-src 'none'");
  if (new URL(request.url).protocol === "https:") headers.set("Strict-Transport-Security", "max-age=31536000");
  if (headers.get("content-type")?.includes("text/html") || new URL(request.url).pathname.startsWith("/_serverFn")) {
    headers.set("Cache-Control", "private, no-store");
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}