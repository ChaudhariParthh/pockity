import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Download, Search, Trash2, Receipt, MoreHorizontal, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AppShell, Card } from "@/components/AppShell";
import { AddDialog } from "@/components/AddDialog";
import { EditDialog } from "@/components/EditDialog";
import { ICONS, fmtDate, inr, txnsQuery, useDeleteTxn, type Txn } from "@/lib/finance";
import { exportCsv } from "./dashboard";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — Pockity" },
      { name: "description", content: "Search, add, export and delete your Pockity transactions." },
      { property: "og:title", content: "Transactions — Pockity" },
      { property: "og:description", content: "Search, add, export and delete your Pockity transactions." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(txnsQuery),
  component: Transactions,
});

function Transactions() {
  const { data: txns } = useSuspenseQuery(txnsQuery);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Txn | null>(null);
  const [query, setQuery] = useState("");
  const del = useDeleteTxn();
  const visible = useMemo(() => {
    const q = query.toLowerCase();
    return txns.filter((t) => `${t.description} ${t.category}`.toLowerCase().includes(q));
  }, [txns, query]);

  return (
    <AppShell title="Transactions" actions={
      <>
        <Button variant="outline" onClick={() => exportCsv(txns)} disabled={!txns.length}><Download className="h-4 w-4" /> Export</Button>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add</Button>
      </>
    }>
      <Card>
        <label className="mb-4 flex items-center gap-2 rounded-lg border bg-muted px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search transactions…" aria-label="Search transactions" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </label>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground"><th className="pb-2">Description</th><th>Date</th><th>Category</th><th className="text-right">Amount</th><th /></tr></thead>
            <tbody>
              {visible.map((t) => {
                const Icon = ICONS[t.category] ?? Receipt;
                return (
                  <tr key={t.id} className="border-t">
                    <td className="py-3"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Icon className="h-4 w-4" /></span><span className="font-medium">{t.description}</span></div></td>
                    <td className="text-muted-foreground">{fmtDate(t.date)}</td>
                    <td className="text-muted-foreground">{t.category}</td>
                    <td className={`text-right font-semibold num ${t.type === "income" ? "text-success" : ""}`}>{t.type === "income" ? "+" : "−"}{inr(t.amount)}</td>
                    <td className="w-10 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Options for ${t.description}`}><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditing(t)}><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => {
                            if (!confirm(`Delete "${t.description}"?`)) return;
                            del.mutate(t.id, { onSuccess: () => toast.success("Deleted"), onError: () => toast.error("Couldn't delete") });
                          }}><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">{txns.length ? "No transactions match your search." : "No transactions yet."}</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      <AddDialog open={open} onOpenChange={setOpen} />
      <EditDialog txn={editing} onClose={() => setEditing(null)} />
    </AppShell>
  );
}
