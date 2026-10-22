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
  it("protects HTML from caching and unsafe content interpretation", () => {
    const result = secureResponse(new Response("page", { headers: { "content-type": "text/html" } }), new Request("https://pockity.lovable.app/settings"));
    expect(result.headers.get("Cache-Control")).toBe("private, no-store");
    expect(result.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(result.headers.get("Strict-Transport-Security")).toBe("max-age=31536000");
    expect(result.headers.get("Content-Security-Policy")).toBe("base-uri 'self'; object-src 'none'");
  });
});