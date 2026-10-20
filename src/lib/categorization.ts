export type TransactionType = "income" | "expense";
export type CategoryGroup = { label: string; categories: string[] };

export const EXPENSE_GROUPS: CategoryGroup[] = [
  { label: "Daily & Living", categories: ["Food & Dining", "Groceries", "Shopping", "Personal Care"] },
  { label: "Housing & Utilities", categories: ["Housing & Rent", "Bills & Utilities", "Home Maintenance"] },
  { label: "Transit & Travel", categories: ["Transit & Fuel", "Travel & Trips"] },
  { label: "Health & Wellness", categories: ["Healthcare & Pharmacy", "Fitness & Sports"] },
  { label: "Family & Education", categories: ["Education", "Family & Kids", "Pets"] },
  { label: "Entertainment & Lifestyle", categories: ["Subscriptions", "Entertainment & Outings", "Gifts & Donations"] },
  { label: "Finance, Debt & Obligations", categories: ["EMIs & Loans", "Credit Card & Banking Fees", "Investments & Savings", "Insurance", "Taxes & Government", "Other Expense"] },
];
export const EXPENSE_CATS = EXPENSE_GROUPS.flatMap((group) => group.categories);

export const INCOME_GROUPS: CategoryGroup[] = [
  { label: "Earned Income", categories: ["Salary", "Freelancing & Gigs", "Business Revenue", "Bonus & Commission"] },
  { label: "Investments & Passive", categories: ["Investment Returns", "Rental Income", "Capital Gains & Crypto"] },
  { label: "Transfers & Windfalls", categories: ["Cashback & Rewards", "Refunds & Reimbursements", "Gifts & Grants", "Other Income"] },
];
export const INCOME_CATS = INCOME_GROUPS.flatMap((group) => group.categories);

// Historical labels remain editable; new transactions use only current labels.
const LEGACY_CATS: Record<TransactionType, string[]> = {
  expense: ["Food", "Transport", "Bills", "Entertainment", "Healthcare", "Housing", "Other"],
  income: ["Freelance", "Business", "Investments", "Other", "Freelancing", "Business Income", "Investment Income", "Cashback", "Gifts", "Scholarship", "Refunds"],
};

export function categoryGroupsFor(type: TransactionType): CategoryGroup[] {
  return type === "income" ? INCOME_GROUPS : EXPENSE_GROUPS;
}

export function categoriesFor(type: TransactionType): string[] {
  return type === "income" ? INCOME_CATS : EXPENSE_CATS;
}

export function isValidCategory(category: string, type: TransactionType, allowLegacy = false): boolean {
  return categoriesFor(type).includes(category) || (allowLegacy && LEGACY_CATS[type].includes(category));
}

export function pickerGroupsFor(type: TransactionType, historical?: string): CategoryGroup[] {
  const groups = categoryGroupsFor(type);
  return historical && isValidCategory(historical, type, true) && !categoriesFor(type).includes(historical)
    ? [...groups, { label: "Previously saved", categories: [historical] }]
    : groups;
}

type Rule = { category: string; phrases: string[] };
const EXPENSE_RULES: Rule[] = [
  { category: "Food & Dining", phrases: ["uber eats", "swiggy", "zomato", "food", "grocery cafe", "restaurant", "cafe", "coffee", "pizza", "burger", "lunch", "dinner", "breakfast", "snack", "snacks", "bakery", "dominos", "domino", "kfc", "mcdonalds", "meal", "meals", "chai", "tea"] },
  { category: "Groceries", phrases: ["grocery", "groceries", "supermarket", "vegetables", "blinkit", "zepto", "instamart"] },
  { category: "Shopping", phrases: ["amazon shoes", "amazon", "flipkart", "myntra", "ajio", "shopping", "clothes", "shoes", "mall", "store", "purchase", "fashion", "electronics", "gadget", "gadgets"] },
  { category: "Personal Care", phrases: ["salon", "haircut", "spa", "barber", "beauty", "cosmetic", "cosmetics", "skincare", "parlour", "parlor", "grooming"] },
  { category: "Housing & Rent", phrases: ["house rent", "rent", "house", "flat", "apartment", "maintenance", "society", "mortgage", "hostel", "pg"] },
  { category: "Bills & Utilities", phrases: ["electricity bill", "water bill", "gas bill", "bill", "bills", "electricity", "water", "gas", "recharge", "mobile recharge", "broadband", "wifi", "internet", "dth", "utility", "utilities", "postpaid", "prepaid", "jio", "airtel"] },
  { category: "Home Maintenance", phrases: ["home repairs", "repairs", "repair", "plumber", "electrician", "cleaning"] },
  { category: "Transit & Fuel", phrases: ["uber ride", "uber", "ola", "rapido", "taxi", "cab", "fuel", "petrol", "diesel", "metro", "bus", "parking", "toll", "auto", "ride"] },
  { category: "Travel & Trips", phrases: ["flight", "flights", "train", "irctc", "hotel", "resort", "airbnb", "travel", "trip", "trips"] },
  { category: "Healthcare & Pharmacy", phrases: ["doctor", "hospital", "medicine", "medicines", "pharmacy", "medical", "clinic", "dentist", "health", "apollo", "lab test"] },
  { category: "Fitness & Sports", phrases: ["gym", "cult", "fitness", "yoga", "trainer", "sports"] },
  { category: "Education", phrases: ["college fees", "school fees", "course", "courses", "udemy", "coursera", "book", "books", "tuition", "school", "college", "exam", "fee", "fees", "class", "learn", "study"] },
  { category: "Family & Kids", phrases: ["daycare", "toys", "baby care", "kids", "childcare"] },
  { category: "Pets", phrases: ["vet", "pet food", "dog grooming", "pet", "pets", "veterinary"] },
  { category: "Subscriptions", phrases: ["amazon prime", "prime video", "apple music", "netflix", "spotify", "hotstar", "youtube premium", "subscription", "subscriptions", "zee5", "sonyliv", "membership", "icloud", "chatgpt", "prime", "youtube", "apple"] },
  { category: "Entertainment & Outings", phrases: ["movie tickets", "movie", "movies", "cinema", "pvr", "inox", "game", "games", "gaming", "concert", "concerts", "show", "bookmyshow", "party", "outing", "ticket", "tickets"] },
  { category: "Gifts & Donations", phrases: ["gifts", "gift", "charity", "donation", "donations"] },
  { category: "EMIs & Loans", phrases: ["home loan", "car loan", "emi", "emis", "personal loan", "loan", "loans"] },
  { category: "Credit Card & Banking Fees", phrases: ["credit card bill", "bank charges", "annual fee", "banking fee", "credit card fee"] },
  { category: "Investments & Savings", phrases: ["sip", "mutual funds", "mutual fund", "stocks", "stock", "zerodha", "groww", "fd", "gold", "savings", "investment", "investments"] },
  { category: "Insurance", phrases: ["life insurance", "health insurance", "vehicle insurance", "insurance", "lic"] },
  { category: "Taxes & Government", phrases: ["income tax", "gst", "property tax", "challan", "tax", "taxes"] },
];
const INCOME_RULES: Rule[] = [
  { category: "Salary", phrases: ["salary credited", "salary", "payroll", "wage", "wages", "paycheck", "stipend"] },
  { category: "Freelancing & Gigs", phrases: ["freelance", "freelancing", "upwork", "fiverr", "client", "invoice", "gig", "gigs"] },
  { category: "Business Revenue", phrases: ["business income", "shop income", "business", "sale", "sales", "shop", "revenue", "profit"] },
  { category: "Bonus & Commission", phrases: ["bonus", "incentive", "commission", "appraisal"] },
  { category: "Investment Returns", phrases: ["investment income", "mutual fund", "mutual funds", "dividend", "dividends", "interest", "stock", "stocks", "shares", "sip", "investment", "investments", "fd", "rd", "fd returns"] },
  { category: "Rental Income", phrases: ["rental income", "rent received", "rent", "tenant", "rental"] },
  { category: "Capital Gains & Crypto", phrases: ["capital gains", "capital gain", "crypto", "bitcoin", "ethereum", "btc"] },
  { category: "Cashback & Rewards", phrases: ["cashback", "cash back", "reward", "rewards", "credit card rewards"] },
  { category: "Refunds & Reimbursements", phrases: ["refund", "refunds", "refunded", "reimbursement", "reimbursed", "money returned", "expense claim"] },
  { category: "Gifts & Grants", phrases: ["gift", "gifts", "birthday money", "gift money", "scholarship", "scholarships", "bursary", "education grant", "grant", "allowance"] },
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

/** Keep manual corrections and valid selections when there is no match. */
export function resolveCategory(description: string, type: TransactionType, current: string, manual: boolean, allowLegacy = false): string {
  const valid = isValidCategory(current, type, allowLegacy);
  if (manual && valid) return current;
  return suggestCategory(description, type) ?? (valid ? current : type === "income" ? "Other Income" : "Other Expense");
}
