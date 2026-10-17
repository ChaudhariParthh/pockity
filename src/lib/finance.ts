import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { Utensils, Bus, ShoppingBag, Receipt, Film, Home, Briefcase, Laptop, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type Txn = { id: string; description: string; amount: number; type: "income" | "expense"; category: string; date: string };
export type NewTxn = Omit<Txn, "id">;

export const EXPENSE_CATS = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Healthcare", "Education", "Housing", "Personal Care", "Subscriptions", "Other"];
export const INCOME_CATS = ["Salary", "Freelance", "Business", "Investments", "Other"];
export const ICONS: Record<string, typeof Utensils> = {
  Food: Utensils, Transport: Bus, Shopping: ShoppingBag, Bills: Receipt, Entertainment: Film, Housing: Home,
  Subscriptions: Sparkles, Salary: Briefcase, Freelance: Laptop,
};

export const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
export const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export const txnsQuery = queryOptions({
  queryKey: ["transactions"],
  queryFn: async (): Promise<Txn[]> => {
    const { data, error } = await supabase.from("transactions").select("id,description,amount,type,category,date").order("date", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => ({ ...r, amount: Number(r.amount), type: r.type as Txn["type"] }));
  },
});

export function useAddTxn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: NewTxn) => {
      const { error } = await supabase.from("transactions").insert(t);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });
}

export function useDeleteTxn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
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

export function safeRedirect(path: unknown): string {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//") ? path : "/dashboard";
}
