export type TransactionType = "income" | "expense";

export const EXPENSE_CATS = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Healthcare", "Education", "Housing", "Personal Care", "Subscriptions", "Other"];
export const INCOME_CATS = ["Salary", "Freelancing", "Business Income", "Investment Income", "Cashback", "Gifts", "Rental Income", "Scholarship", "Refunds", "Other Income"];

// Previously saved labels remain editable without rewriting historical records.
const LEGACY_INCOME_CATS = ["Freelance", "Business", "Investments", "Other"];

export function categoriesFor(type: TransactionType): string[] {
  return type === "income" ? INCOME_CATS : EXPENSE_CATS;
}

export function isValidCategory(category: string, type: TransactionType, allowLegacy = false): boolean {
  return categoriesFor(type).includes(category) || (allowLegacy && type === "income" && LEGACY_INCOME_CATS.includes(category));
}

type Rule = { category: string; phrases: string[] };
const EXPENSE_RULES: Rule[] = [
  { category: "Food", phrases: ["uber eats", "swiggy", "zomato", "food", "grocery", "groceries", "restaurant", "cafe", "coffee", "pizza", "burger", "lunch", "dinner", "breakfast", "snack", "snacks", "bakery", "dominos", "domino", "kfc", "mcdonalds", "meal", "meals", "chai", "tea"] },
  { category: "Subscriptions", phrases: ["amazon prime", "prime video", "apple music", "netflix", "spotify", "hotstar", "youtube premium", "subscription", "subscriptions", "zee5", "sonyliv", "membership", "icloud", "chatgpt"] },
  { category: "Transport", phrases: ["uber ride", "uber", "ola", "rapido", "taxi", "cab", "fuel", "petrol", "diesel", "metro", "bus", "train", "flight", "irctc", "parking", "toll", "auto", "ride", "travel"] },
  { category: "Shopping", phrases: ["amazon shoes", "amazon", "flipkart", "myntra", "ajio", "shopping", "clothes", "shoes", "mall", "store", "purchase", "fashion", "electronics", "gadget", "gadgets"] },
  { category: "Bills", phrases: ["electricity bill", "water bill", "gas bill", "bill", "bills", "electricity", "recharge", "mobile recharge", "broadband", "wifi", "internet", "dth", "utility", "utilities", "postpaid", "prepaid", "jio", "airtel"] },
  { category: "Entertainment", phrases: ["movie tickets", "movie", "movies", "cinema", "pvr", "inox", "game", "games", "gaming", "concert", "show", "bookmyshow", "party", "outing", "ticket", "tickets"] },
  { category: "Healthcare", phrases: ["doctor", "hospital", "medicine", "medicines", "pharmacy", "medical", "clinic", "dentist", "health", "apollo", "lab test", "gym", "fitness"] },
  { category: "Education", phrases: ["college fees", "school fees", "course", "udemy", "coursera", "book", "books", "tuition", "school", "college", "exam", "fee", "fees", "class", "learn", "study"] },
  { category: "Housing", phrases: ["house rent", "rent", "house", "flat", "apartment", "maintenance", "society", "mortgage", "hostel", "pg"] },
  { category: "Personal Care", phrases: ["salon", "haircut", "spa", "barber", "beauty", "cosmetic", "cosmetics", "skincare", "parlour", "parlor"] },
];
const INCOME_RULES: Rule[] = [
  { category: "Salary", phrases: ["salary credited", "salary", "payroll", "wage", "wages", "paycheck", "stipend"] },
  { category: "Freelancing", phrases: ["freelance", "freelancing", "upwork", "fiverr", "client", "invoice", "gig"] },
  { category: "Business Income", phrases: ["business income", "shop income", "business", "sale", "sales", "revenue", "profit"] },
  { category: "Investment Income", phrases: ["investment income", "mutual fund", "dividend", "dividends", "interest", "stock", "shares", "sip", "investment", "investments", "fd", "rd"] },
  { category: "Cashback", phrases: ["cashback", "cash back", "reward", "rewards"] },
  { category: "Gifts", phrases: ["gift", "gifts", "birthday money", "gift money"] },
  { category: "Rental Income", phrases: ["rental income", "rent received", "rent", "tenant", "rental"] },
  { category: "Scholarship", phrases: ["scholarship", "scholarships", "bursary", "education grant"] },
  { category: "Refunds", phrases: ["refund", "refunds", "refunded", "reimbursement", "reimbursed", "money returned"] },
];

function normalize(text: string): string {
  return text.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

/** Whole-word matching; the most specific phrase wins over a generic merchant. */
export function suggestCategory(description: string, type: TransactionType): string | undefined {
  const text = normalize(description);
  if (!text) return undefined;
  const haystack = ` ${text} `;
  let best: { category: string; score: number } | undefined;
  for (const rule of type === "income" ? INCOME_RULES : EXPENSE_RULES) {
    for (const phrase of rule.phrases) {
      const keyword = normalize(phrase);
      if (!haystack.includes(` ${keyword} `)) continue;
      const score = keyword.split(" ").length * 100 + keyword.length;
      if (!best || score > best.score) best = { category: rule.category, score };
    }
  }
  return best && isValidCategory(best.category, type) ? best.category : undefined;
}

/** Keep manual corrections, and retain a valid current selection on no match. */
export function resolveCategory(description: string, type: TransactionType, current: string, manual: boolean): string {
  const valid = isValidCategory(current, type);
  if (manual && valid) return current;
  return suggestCategory(description, type) ?? (valid ? current : type === "income" ? "Other Income" : "Other");
}