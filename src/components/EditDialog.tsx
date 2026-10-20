import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryPicker } from "@/components/CategoryPicker";
import { useUpdateTxn, type Txn } from "@/lib/finance";
import { isValidCategory, resolveCategory } from "@/lib/categorization";

export function EditDialog({ txn, onClose }: { txn: Txn | null; onClose: () => void }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food & Dining");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const update = useUpdateTxn();

  useEffect(() => {
    if (txn) {
      setDescription(txn.description);
      setAmount(String(txn.amount));
      setCategory(txn.category);
      setCategoryTouched(false);
      setDate(txn.date);
      setError("");
    }
  }, [txn]);

  const submit = async () => {
    if (!txn) return;
    const amt = Number(amount);
    if (!description.trim() || description.length > 100) return setError("Enter a description (max 100 characters).");
    if (!(amt > 0) || amt > 1e9) return setError("Amount must be a positive number.");
    if (!isValidCategory(category, txn.type, true)) return setError("Select a valid category.");
    try {
      await update.mutateAsync({ id: txn.id, type: txn.type, description: description.trim(), amount: Math.round(amt * 100) / 100, category, date });
      toast.success("Transaction updated");
      onClose();
    } catch {
      setError("Couldn't save the changes. Please try again.");
    }
  };

  return (
    <Dialog open={!!txn} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit transaction</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5"><Label htmlFor="ed">Description</Label><Input id="ed" maxLength={100} value={description} onChange={(e) => { const value = e.target.value; setDescription(value); if (txn) setCategory((current) => resolveCategory(value, txn.type, current, categoryTouched, true)); }} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label htmlFor="ea">Amount (₹)</Label><Input id="ea" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label htmlFor="edt">Date</Label><Input id="edt" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <div className="grid gap-1.5"><Label>Category</Label>
            {txn && <CategoryPicker type={txn.type} value={category} historical={txn.category} onChange={(value) => { setCategoryTouched(true); setCategory(value); }} />}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={update.isPending}>{update.isPending ? "Saving…" : "Save changes"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
