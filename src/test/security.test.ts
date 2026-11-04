import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { clearPrivateCache, csvCell, safeRedirect, secureResponse, transactionSchema, transactionUpdateSchema } from "@/lib/security";

const transaction = { description: "Groceries", amount: 25, type: "expense", category: "Groceries", date: "2026-10-22" };
describe("Security safeguards", () => {
  it("only redirects to known private pages", () => {
    for (const path of ["https://attacker.example", "//attacker.example", "/\\attacker.example", "/auth", "/%2f%2fattacker.example"]) expect(safeRedirect(path)).toBe("/dashboard");
    expect(safeRedirect("/transactions")).toBe("/transactions");
  });
  it("rejects unexpected ownership fields", () => {
    expect(transactionSchema.safeParse({ ...transaction, user_id: "other-user" }).success).toBe(false);
    expect(transactionSchema.safeParse(transaction).success).toBe(true);
  });
  it("rejects nonfinite, zero, negative and excessive amounts", () => {
    for (const amount of [NaN, Infinity, -1, 0, 0.001, 1000000001]) expect(transactionSchema.safeParse({ ...transaction, amount }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...transaction, amount: 1000000000 }).success).toBe(true);
  });
  it("rejects blank or overlong descriptions", () => {
    for (const description of ["   ", "a".repeat(101)]) expect(transactionSchema.safeParse({ ...transaction, description }).success).toBe(false);
  });
  it("rejects invalid dates and transaction types", () => {
    expect(transactionSchema.safeParse({ ...transaction, date: "2026-02-30" }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...transaction, type: "admin" }).success).toBe(false);
  });
  it("accepts historical categories only during editing", () => {
    expect(transactionSchema.safeParse({ ...transaction, category: "Food" }).success).toBe(false);
    expect(transactionUpdateSchema.safeParse({ ...transaction, id: "4da81e8c-8237-4c9f-9bc2-cada154f48ee", category: "Food" }).success).toBe(true);
  });
  it("neutralizes spreadsheet formulas, including whitespace prefixes", () => {
    for (const text of ["=1+1", "+SUM(A1:A2)", "-1+1", "@SUM(A1)", "  =1+1", "\t=1+1"]) expect(csvCell(text)).toBe(`"'${text}"`);
    expect(csvCell('Food, "coffee"')).toBe('"Food, ""coffee"""');
  });
  it("cancels pending requests before removing cached finances", async () => {
    const cache = new QueryClient(); cache.setQueryData(["transactions"], [{ description: "private" }]);
    const cancel = vi.spyOn(cache, "cancelQueries"); const clear = vi.spyOn(cache, "clear");
    await clearPrivateCache(cache);
    expect(cache.getQueryData(["transactions"])).toBeUndefined();
    expect(cancel.mock.invocationCallOrder[0]).toBeLessThan(clear.mock.invocationCallOrder[0] ?? 0);
  });

  // SECURITY HEADERS TESTS
  it("adds comprehensive security headers to HTTPS responses", () => {
    const result = secureResponse(new Response("page", { headers: { "content-type": "text/html" } }), new Request("https://pockity.lovable.app/settings"));

    // Core security headers
    expect(result.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(result.headers.get("X-Frame-Options")).toBe("DENY");
    expect(result.headers.get("X-XSS-Protection")).toBe("1; mode=block");
    expect(result.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(result.headers.get("Permissions-Policy")).toBe("geolocation=(), microphone=(), camera=(), payment=()");

    // HTTPS security
    expect(result.headers.get("Strict-Transport-Security")).toBe("max-age=31536000; includeSubDomains");
  });

  it("adds no-cache headers to JSON responses", () => {
    const result = secureResponse(new Response('{"data":"sensitive"}', { headers: { "content-type": "application/json" } }), new Request("http://localhost:5173/api/data"));

    // Cache prevention
    expect(result.headers.get("Cache-Control")).toBe("private, no-store, no-cache, must-revalidate");
    expect(result.headers.get("Pragma")).toBe("no-cache");
  });

  it("adds security headers without HSTS on HTTP (non-HTTPS) requests", () => {
    const result = secureResponse(new Response("page", { headers: { "content-type": "text/html" } }), new Request("http://localhost:5173/dashboard"));

    // HTTP should NOT have HSTS
    expect(result.headers.get("Strict-Transport-Security")).toBeNull();
    // But other security headers should be present
    expect(result.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("protects HTML from caching and unsafe content interpretation", () => {
    const result = secureResponse(new Response("page", { headers: { "content-type": "text/html" } }), new Request("https://pockity.lovable.app/settings"));
    expect(result.headers.get("Cache-Control")).toBe("private, no-store, no-cache, must-revalidate");
    expect(result.headers.get("X-Content-Type-Options")).toBe("nosniff");
    // CSP is always set; exact value depends on dev vs prod mode
    expect(result.headers.get("Content-Security-Policy")).toContain("base-uri 'self'");
    expect(result.headers.get("Content-Security-Policy")).toContain("object-src 'none'");
  });

  it("uses strict CSP in production and relaxed CSP in development", () => {
    const original = process.env['NODE_ENV'];

    // Production: strict CSP. 'unsafe-inline' is required because TanStack Router
    // SSR injects inline hydration scripts (data-tsr-stream-part / window.$_TSR)
    // and the root route injects an inline theme-init script; without it the
    // browser blocks them and client hydration never starts (blank page).
    process.env['NODE_ENV'] = 'production';
    const prodResult = secureResponse(new Response("page", { headers: { "content-type": "text/html" } }), new Request("https://pockity.lovable.app/"));
    expect(prodResult.headers.get("Content-Security-Policy")).toContain("script-src 'self' 'unsafe-inline';");
    expect(prodResult.headers.get("Content-Security-Policy")).not.toContain("'unsafe-eval'");

    // Development: relaxed CSP for Vite HMR
    process.env['NODE_ENV'] = 'development';
    const devResult = secureResponse(new Response("page", { headers: { "content-type": "text/html" } }), new Request("https://pockity.lovable.app/"));
    expect(devResult.headers.get("Content-Security-Policy")).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    expect(devResult.headers.get("Content-Security-Policy")).toContain("style-src 'self' 'unsafe-inline'");

    process.env['NODE_ENV'] = original;
  });
  it("allows only the configured backend origin for app connections", () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://pockity-test.lovable.cloud");
    try {
      const result = secureResponse(new Response("page"), new Request("https://pockity.lovable.app/"));
      const policy = result.headers.get("Content-Security-Policy") ?? "";
      expect(policy).toContain("connect-src 'self' https://pockity-test.lovable.cloud;");
      expect(policy).not.toContain("nuvapxtjwxicqlwixhdi");
      expect(policy).not.toContain("connect-src *");
    } finally { vi.unstubAllEnvs(); }
  });
  it("permits trusted editor framing without allowing production framing", () => {
    const preview = secureResponse(new Response("page"), new Request("https://id-preview--d05b457c-1582-406a-ad93-7c7d5441351b.lovable.app/"));
    expect(preview.headers.get("X-Frame-Options")).toBeNull();
    expect(preview.headers.get("Content-Security-Policy")).toContain("frame-ancestors https://lovable.dev https://*.lovable.dev;");
    const production = secureResponse(new Response("page"), new Request("https://pockity.lovable.app/"));
    expect(production.headers.get("X-Frame-Options")).toBe("DENY");
    expect(production.headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none';");
  });
});