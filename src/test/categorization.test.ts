import { describe, expect, it } from "vitest";
import { categoriesFor, isValidCategory, resolveCategory, suggestCategory } from "@/lib/categorization";

describe("Transaction categorization", () => {
  it.each([
    ["Swiggy", "Food"], ["Uber ride", "Transport"], ["Uber Eats", "Food"],
    ["Amazon shoes", "Shopping"], ["Netflix", "Subscriptions"], ["electricity bill", "Bills"],
    ["college fees", "Education"], ["rent", "Housing"], ["medicines", "Healthcare"],
    ["Movie tickets PVR", "Entertainment"], ["Salon haircut", "Personal Care"],
    ["UBER-EATS dinner", "Food"], ["Amazon Prime subscription", "Subscriptions"],
  ])("matches expense %s to %s", (description, expected) => {
    expect(suggestCategory(description, "expense")).toBe(expected);
  });
  it.each([
    ["salary credited", "Salary"], ["Upwork payment", "Freelancing"],
    ["business income", "Business Income"], ["dividend interest", "Investment Income"],
    ["cashback", "Cashback"], ["birthday gift", "Gifts"], ["rent received", "Rental Income"],
    ["college scholarship", "Scholarship"], ["Amazon refund", "Refunds"],
  ])("matches income %s to %s", (description, expected) => {
    expect(suggestCategory(description, "income")).toBe(expected);
  });
  it("keeps exactly the existing expense categories", () => {
    expect(categoriesFor("expense")).toEqual(["Food", "Transport", "Shopping", "Bills", "Entertainment", "Healthcare", "Education", "Housing", "Personal Care", "Subscriptions", "Other"]);
  });
  it("offers the requested income categories", () => {
    expect(categoriesFor("income")).toEqual(["Salary", "Freelancing", "Business Income", "Investment Income", "Cashback", "Gifts", "Rental Income", "Scholarship", "Refunds", "Other Income"]);
  });
  it("updates suggestions as descriptions change", () => {
    const first = resolveCategory("Uber ride", "expense", "Food", false);
    expect(resolveCategory("Uber Eats", "expense", first, false)).toBe("Food");
  });
  it("never overwrites a valid manual correction", () => {
    expect(resolveCategory("Netflix", "expense", "Education", true)).toBe("Education");
  });
  it("retains valid categories on empty or unknown descriptions", () => {
    expect(resolveCategory("", "expense", "Shopping", false)).toBe("Shopping");
    expect(resolveCategory("Unrecognized payment", "income", "Gifts", false)).toBe("Gifts");
  });
  it("uses type-appropriate fallback when the current category is invalid", () => {
    expect(resolveCategory("unknown", "expense", "Salary", false)).toBe("Other");
    expect(resolveCategory("unknown", "income", "Food", false)).toBe("Other Income");
  });
  it("isolates income and expense matching", () => {
    expect(suggestCategory("salary credited", "expense")).toBeUndefined();
    expect(suggestCategory("Swiggy", "income")).toBeUndefined();
    expect(resolveCategory("rent", "income", "Salary", false)).toBe("Rental Income");
  });
  it("does not match keywords within unrelated words", () => {
    expect(suggestCategory("steam showcase businessteam", "expense")).toBeUndefined();
  });
  it("allows legacy labels only for existing income transactions", () => {
    expect(isValidCategory("Freelance", "income", true)).toBe(true);
    expect(isValidCategory("Freelance", "income")).toBe(false);
    expect(isValidCategory("Salary", "expense", true)).toBe(false);
    expect(isValidCategory("Invented", "income", true)).toBe(false);
  });
});