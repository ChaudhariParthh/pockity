import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EXPENSE_CATS, INCOME_CATS, useUpdateTxn, type Txn } from "@/lib/finance";

export function EditDialog({ txn, onClose }: { txn: Txn | null; onClose: () => void }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const update = useUpdateTxn();

  useEffect(() => {
    if (txn) {
      setDescription(txn.description);
      setAmount(String(txn.amount));
      setCategory(txn.category);
      setDate(txn.date);
      setError("");
    }
  }, [txn]);

  const cats = txn?.type === "income" ? INCOME_CATS : EXPENSE_CATS;

  const submit = async () => {
    if (!txn) return;
    const amt = Number(amount);
    if (!description.trim() || description.length > 100) return setError("Enter a description (max 100 characters).");
    if (!(amt > 0) || amt > 1e9) return setError("Amount must be a positive number.");
    try {
      await update.mutateAsync({ id: txn.id, description: description.trim(), amount: Math.round(amt * 100) / 100, category, date });
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
          <div className="grid gap-1.5"><Label htmlFor="ed">Description</Label><Input id="ed" maxLength={100} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label htmlFor="ea">Amount (₹)</Label><Input id="ea" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label htmlFor="edt">Date</Label><Input id="edt" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <div className="grid gap-1.5"><Label>Category</Label>
            <Select value={category} onValueChange={setCategory}><SelectTrigger aria-label="Category"><SelectValue /></SelectTrigger><SelectContent>{cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={update.isPending}>{update.isPending ? "Saving…" : "Save changes"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
