import { describe, expect, it } from "vitest";
import { categoriesFor, pickerGroupsFor, isValidCategory, resolveCategory, suggestCategory } from "@/lib/categorization";

describe("Transaction categorization", () => {
  it.each([
    ["Swiggy", "Food & Dining"], ["Uber ride", "Transit & Fuel"], ["Uber Eats", "Food & Dining"],
    ["Amazon shoes", "Shopping"], ["Netflix", "Subscriptions"], ["electricity bill", "Bills & Utilities"],
    ["college fees", "Education"], ["rent", "Housing & Rent"], ["medicines", "Healthcare & Pharmacy"],
    ["Movie tickets PVR", "Entertainment & Outings"], ["Salon haircut", "Personal Care"],
    ["UBER-EATS dinner", "Food & Dining"], ["Amazon Prime subscription", "Subscriptions"],
  ])("matches expense %s to %s", (description, expected) => {
    expect(suggestCategory(description, "expense")).toBe(expected);
  });
  it.each([
    ["salary credited", "Salary"], ["Upwork payment", "Freelancing & Gigs"],
    ["business income", "Business Revenue"], ["dividend interest", "Investment Returns"],
    ["cashback", "Cashback & Rewards"], ["birthday gift", "Gifts & Grants"], ["rent received", "Rental Income"],
    ["college scholarship", "Gifts & Grants"], ["Amazon refund", "Refunds & Reimbursements"],
  ])("matches income %s to %s", (description, expected) => {
    expect(suggestCategory(description, "income")).toBe(expected);
  });
  it("offers exactly the requested expense categories", () => {
    expect(categoriesFor("expense")).toEqual(["Food & Dining", "Groceries", "Shopping", "Personal Care", "Housing & Rent", "Bills & Utilities", "Home Maintenance", "Transit & Fuel", "Travel & Trips", "Healthcare & Pharmacy", "Fitness & Sports", "Education", "Family & Kids", "Pets", "Subscriptions", "Entertainment & Outings", "Gifts & Donations", "EMIs & Loans", "Credit Card & Banking Fees", "Investments & Savings", "Insurance", "Taxes & Government", "Other Expense"]);
  });
  it("offers exactly the requested income categories", () => {
    expect(categoriesFor("income")).toEqual(["Salary", "Freelancing & Gigs", "Business Revenue", "Bonus & Commission", "Investment Returns", "Rental Income", "Capital Gains & Crypto", "Cashback & Rewards", "Refunds & Reimbursements", "Gifts & Grants", "Other Income"]);
  });
  it("updates suggestions as descriptions change", () => {
    const first = resolveCategory("Uber ride", "expense", "Food & Dining", false);
    expect(resolveCategory("Uber Eats", "expense", first, false)).toBe("Food & Dining");
  });
  it("never overwrites a valid manual correction", () => {
    expect(resolveCategory("Netflix", "expense", "Education", true)).toBe("Education");
  });
  it("retains valid categories on empty or unknown descriptions", () => {
    expect(resolveCategory("", "expense", "Shopping", false)).toBe("Shopping");
    expect(resolveCategory("Unrecognized payment", "income", "Gifts & Grants", false)).toBe("Gifts & Grants");
  });
  it("uses type-appropriate fallback when the current category is invalid", () => {
    expect(resolveCategory("unknown", "expense", "Salary", false)).toBe("Other Expense");
    expect(resolveCategory("unknown", "income", "Food & Dining", false)).toBe("Other Income");
  });
  it("isolates income and expense matching", () => {
    expect(suggestCategory("salary credited", "expense")).toBeUndefined();
    expect(suggestCategory("Swiggy", "income")).toBeUndefined();
    expect(resolveCategory("rent", "income", "Salary", false)).toBe("Rental Income");
  });
  it("does not match keywords within unrelated words", () => {
    expect(suggestCategory("steam showcase businessteam", "expense")).toBeUndefined();
  });
  it("allows legacy labels only for existing transactions", () => {
    expect(isValidCategory("Freelance", "income", true)).toBe(true);
    expect(isValidCategory("Freelance", "income")).toBe(false);
    expect(isValidCategory("Salary", "expense", true)).toBe(false);
    expect(isValidCategory("Invented", "income", true)).toBe(false);
  });
});

describe("Expanded category matching and compatibility", () => {
  it.each([
    ["Blinkit vegetables", "Groceries"], ["groceries", "Groceries"],
    ["plumber repairs", "Home Maintenance"], ["IRCTC train", "Travel & Trips"],
    ["gym yoga", "Fitness & Sports"], ["baby care", "Family & Kids"],
    ["pet food", "Pets"], ["dog grooming", "Pets"], ["charity donation", "Gifts & Donations"],
    ["home loan emi", "EMIs & Loans"], ["credit card bill", "Credit Card & Banking Fees"],
    ["annual fee", "Credit Card & Banking Fees"], ["Groww mutual funds", "Investments & Savings"],
    ["health insurance", "Insurance"], ["property tax", "Taxes & Government"],
  ])("matches expanded expense %s to %s", (description, expected) => {
    expect(suggestCategory(description, "expense")).toBe(expected);
  });
  it.each([
    ["bonus commission", "Bonus & Commission"], ["fd returns", "Investment Returns"],
    ["capital gains", "Capital Gains & Crypto"], ["crypto", "Capital Gains & Crypto"],
    ["credit card rewards", "Cashback & Rewards"], ["expense claim", "Refunds & Reimbursements"],
    ["allowance", "Gifts & Grants"],
  ])("matches expanded income %s to %s", (description, expected) => {
    expect(suggestCategory(description, "income")).toBe(expected);
  });
  it.each([
    ["expense", ["Food", "Transport", "Bills", "Entertainment", "Healthcare", "Housing", "Other"]],
    ["income", ["Freelance", "Business", "Investments", "Other", "Freelancing", "Business Income", "Investment Income", "Cashback", "Gifts", "Scholarship", "Refunds"]],
  ] as const)("preserves historical %s labels without offering them for new transactions", (type, labels) => {
    for (const label of labels) {
      expect(isValidCategory(label, type, true)).toBe(true);
      expect(isValidCategory(label, type)).toBe(false);
      expect(pickerGroupsFor(type, label).at(-1)).toEqual({ label: "Previously saved", categories: [label] });
    }
  });
  it("keeps historical selections on unchanged or unknown descriptions", () => {
    expect(resolveCategory("unknown", "expense", "Food", false, true)).toBe("Food");
    expect(resolveCategory("Netflix", "expense", "Food", true, true)).toBe("Food");
  });
  it("isolates grouped pickers when switching types", () => {
    expect(pickerGroupsFor("expense").map(g => g.label)).toEqual(["Daily & Living", "Housing & Utilities", "Transit & Travel", "Health & Wellness", "Family & Education", "Entertainment & Lifestyle", "Finance, Debt & Obligations"]);
    expect(pickerGroupsFor("income").map(g => g.label)).toEqual(["Earned Income", "Investments & Passive", "Transfers & Windfalls"]);
    expect(pickerGroupsFor("income", "Food").flatMap(g => g.categories)).not.toContain("Food");
  });
});
