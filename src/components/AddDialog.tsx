import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EXPENSE_CATS, INCOME_CATS, suggestCategory, useAddTxn } from "@/lib/finance";

export function AddDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const add = useAddTxn();
  const cats = type === "income" ? INCOME_CATS : EXPENSE_CATS;

  const onDescriptionChange = (value: string) => {
    setDescription(value);
    if (!categoryTouched) {
      const guess = suggestCategory(value, type);
      if (guess) setCategory(guess);
    }
  };

  const submit = async () => {
    const amt = Number(amount);
    if (!description.trim() || description.length > 100) return setError("Enter a description (max 100 characters).");
    if (!(amt > 0) || amt > 1e9) return setError("Amount must be a positive number.");
    try {
      await add.mutateAsync({ description: description.trim(), amount: Math.round(amt * 100) / 100, type, category, date });
      toast.success("Transaction added");
      setDescription(""); setAmount(""); setError(""); onOpenChange(false);
    } catch {
      setError("Couldn't save the transaction. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add transaction</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <Tabs value={type} onValueChange={(v) => { const t = v as "income" | "expense"; setType(t); setCategoryTouched(false); setCategory(suggestCategory(description, t) ?? (t === "income" ? "Salary" : "Food")); }}>
            <TabsList className="w-full"><TabsTrigger value="expense" className="flex-1">Expense</TabsTrigger><TabsTrigger value="income" className="flex-1">Income</TabsTrigger></TabsList>
          </Tabs>
          <div className="grid gap-1.5"><Label htmlFor="d">Description</Label><Input id="d" maxLength={100} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Groceries" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label htmlFor="a">Amount (₹)</Label><Input id="a" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label htmlFor="dt">Date</Label><Input id="dt" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <div className="grid gap-1.5"><Label>Category</Label>
            <Select value={category} onValueChange={setCategory}><SelectTrigger aria-label="Category"><SelectValue /></SelectTrigger><SelectContent>{cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit} disabled={add.isPending}>{add.isPending ? "Saving…" : "Save"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
