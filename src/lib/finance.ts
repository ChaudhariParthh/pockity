import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { Utensils, Bus, ShoppingBag, Receipt, Film, Home, Briefcase, Laptop, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isValidCategory } from "@/lib/categorization";
export { EXPENSE_CATS, INCOME_CATS, suggestCategory } from "@/lib/categorization";

export type Txn = { id: string; description: string; amount: number; type: "income" | "expense"; category: string; date: string };
export type NewTxn = Omit<Txn, "id">;

export const ICONS: Record<string, typeof Utensils> = {
  Food: Utensils, Transport: Bus, Shopping: ShoppingBag, Bills: Receipt, Entertainment: Film, Housing: Home,
  Subscriptions: Sparkles, Salary: Briefcase, Freelance: Laptop, Freelancing: Laptop,
};

export const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
export const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export const txnsQuery = queryOptions({
  queryKey: ["transactions"],
  staleTime: 30_000,
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
      if (!isValidCategory(t.category, t.type)) throw new Error("Invalid category");
      const { error } = await supabase.from("transactions").insert(t);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });
}

export function useUpdateTxn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Pick<Txn, "id"> & Partial<NewTxn>) => {
      const { id, ...fields } = t;
      if (fields.description !== undefined && (!fields.description.trim() || fields.description.length > 100)) throw new Error("Invalid description");
      if (fields.amount !== undefined && (!(fields.amount > 0) || fields.amount > 1e9)) throw new Error("Invalid amount");
      if (fields.category !== undefined && !(fields.type
        ? isValidCategory(fields.category, fields.type, true)
        : isValidCategory(fields.category, "income", true) || isValidCategory(fields.category, "expense"))) throw new Error("Invalid category");
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
