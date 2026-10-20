import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryPicker } from "@/components/CategoryPicker";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAddTxn } from "@/lib/finance";
import { isValidCategory, resolveCategory, type TransactionType } from "@/lib/categorization";

export function AddDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categories, setCategories] = useState({ expense: "Food & Dining", income: "Salary" });
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [categoryTouched, setCategoryTouched] = useState({ expense: false, income: false });
  const add = useAddTxn();
  const category = categories[type];

  const onDescriptionChange = (value: string) => {
    setDescription(value);
    setCategories((current) => ({ ...current, [type]: resolveCategory(value, type, current[type], categoryTouched[type]) }));
  };

  const onTypeChange = (value: string) => {
    if (value !== "income" && value !== "expense") return;
    const next: TransactionType = value;
    setType(next);
    setCategories((current) => ({ ...current, [next]: resolveCategory(description, next, current[next], categoryTouched[next]) }));
  };

  const submit = async () => {
    const amt = Number(amount);
    if (!description.trim() || description.length > 100) return setError("Enter a description (max 100 characters).");
    if (!(amt > 0) || amt > 1e9) return setError("Amount must be a positive number.");
    if (!isValidCategory(category, type)) return setError("Select a valid category.");
    try {
      await add.mutateAsync({ description: description.trim(), amount: Math.round(amt * 100) / 100, type, category, date });
      toast.success("Transaction added");
      setDescription(""); setAmount(""); setError(""); setCategoryTouched({ expense: false, income: false }); onOpenChange(false);
    } catch {
      setError("Couldn't save the transaction. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add transaction</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <Tabs value={type} onValueChange={onTypeChange}>
            <TabsList className="w-full"><TabsTrigger value="expense" className="flex-1">Expense</TabsTrigger><TabsTrigger value="income" className="flex-1">Income</TabsTrigger></TabsList>
          </Tabs>
          <div className="grid gap-1.5"><Label htmlFor="d">Description</Label><Input id="d" maxLength={100} value={description} onChange={(e) => onDescriptionChange(e.target.value)} placeholder="e.g. Groceries" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label htmlFor="a">Amount (₹)</Label><Input id="a" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label htmlFor="dt">Date</Label><Input id="dt" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <div className="grid gap-1.5"><Label>Category</Label>
            <CategoryPicker type={type} value={category} onChange={(v) => { setCategoryTouched((current) => ({ ...current, [type]: true })); setCategories((current) => ({ ...current, [type]: v })); }} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit} disabled={add.isPending}>{add.isPending ? "Saving…" : "Save"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
