import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { Utensils, Bus, ShoppingBag, Receipt, Film, Home, Briefcase, Laptop, Sparkles, ShoppingBasket, Wrench, Plane, HeartPulse, Dumbbell, GraduationCap, Baby, PawPrint, Gift, Landmark, CreditCard, TrendingUp, Shield, Building2, Award, Coins, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { transactionSchema, transactionUpdateSchema, transactionIdSchema } from "@/lib/security";
export { safeRedirect } from "@/lib/security";
export { EXPENSE_CATS, INCOME_CATS, suggestCategory } from "@/lib/categorization";

export type Txn = { id: string; description: string; amount: number; type: "income" | "expense"; category: string; date: string };
export type NewTxn = Omit<Txn, "id">;

export const ICONS: Record<string, typeof Utensils> = {
  Food: Utensils, Transport: Bus, Shopping: ShoppingBag, Bills: Receipt, Entertainment: Film, Housing: Home,
  Subscriptions: Sparkles, Salary: Briefcase, Freelance: Laptop, Freelancing: Laptop,
  "Food & Dining": Utensils, Groceries: ShoppingBasket, "Housing & Rent": Home,
  "Bills & Utilities": Receipt, "Home Maintenance": Wrench, "Transit & Fuel": Bus,
  "Travel & Trips": Plane, "Healthcare & Pharmacy": HeartPulse, "Fitness & Sports": Dumbbell,
  Education: GraduationCap, "Family & Kids": Baby, Pets: PawPrint, "Personal Care": Sparkles,
  "Entertainment & Outings": Film, "Gifts & Donations": Gift, "EMIs & Loans": Landmark,
  "Credit Card & Banking Fees": CreditCard, "Investments & Savings": TrendingUp, Insurance: Shield,
  "Taxes & Government": Building2, "Other Expense": Receipt, "Freelancing & Gigs": Laptop,
  "Business Revenue": Briefcase, "Bonus & Commission": Award, "Investment Returns": TrendingUp,
  "Rental Income": Home, "Capital Gains & Crypto": Coins, "Cashback & Rewards": Award,
  "Refunds & Reimbursements": RotateCcw, "Gifts & Grants": Gift, "Other Income": Receipt,
};

export const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
export const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export const txnsQuery = queryOptions({
  queryKey: ["transactions"],
  staleTime: 30_000,
  queryFn: async ({ signal }): Promise<Txn[]> => {
    const { data, error } = await supabase.from("transactions").select("id,description,amount,type,category,date").order("date", { ascending: false }).abortSignal(signal);
    if (error) throw error;
    return (data ?? []).map((r) => ({ ...r, amount: Number(r.amount), type: r.type as Txn["type"] }));
  },
});

export function useAddTxn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: NewTxn) => {
      const fields = transactionSchema.parse(t);
      const { error } = await supabase.from("transactions").insert(fields);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });
}

export function useUpdateTxn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Pick<Txn, "id"> & Partial<NewTxn>) => {
      const { id, ...fields } = transactionUpdateSchema.parse(t);
      const { error } = await supabase.from("transactions").update(fields).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });
}

export function useDeleteTxn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", transactionIdSchema.parse(id));
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });
}

/** Group transactions into the last N calendar months ending at `now`. */
export function monthlyTrend(txns: Txn[], months = 6, now = new Date()) {
  const out: { key: string; m: string; income: number; expense: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, m: d.toLocaleString("en-IN", { month: "short" }), income: 0, expense: 0 });
  }
  for (const t of txns) {
    const row = out.find((r) => r.key === t.date.slice(0, 7));
    if (row) row[t.type] += t.amount;
  }
  return out;
}

