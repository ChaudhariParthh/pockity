import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { Plus, Download, Wallet, PiggyBank, ArrowDownLeft, ArrowUpRight, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppShell, Card } from "@/components/AppShell";
import { AddDialog } from "@/components/AddDialog";
import { ICONS, fmtDate, inr, monthlyTrend, txnsQuery, type Txn } from "@/lib/finance";
import { csvCell } from "@/lib/security";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Pockity" },
      { name: "description", content: "Your monthly cash flow, income and expenses at a glance." },
      { property: "og:title", content: "Dashboard — Pockity" },
      { property: "og:description", content: "Your monthly cash flow, income and expenses at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(txnsQuery),
  component: Dashboard,
});

export function exportCsv(txns: Txn[]) {
  const rows = [["Date", "Description", "Type", "Category", "Amount"], ...txns.map((t) => [t.date, t.description, t.type, t.category, String(t.amount)])];
  const blob = new Blob([rows.map((r) => r.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "pockity-transactions.csv"; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function Dashboard() {
  const { data: txns } = useSuspenseQuery(txnsQuery);
  const { user } = Route.useRouteContext();
  const [open, setOpen] = useState(false);
  const [statTab, setStatTab] = useState<"income" | "expense">("expense");
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthTxns = txns.filter((t) => t.date.startsWith(thisMonth));
  const income = monthTxns.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
  const expense = monthTxns.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0);
  const net = income - expense;
  const trend = monthlyTrend(txns, 6);
  const breakdown = useMemo(() => {
    const map: Record<string, number> = {};
    monthTxns.filter((t) => t.type === statTab).forEach((t) => (map[t.category] = (map[t.category] ?? 0) + t.amount));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [monthTxns, statTab]);
  const breakdownTotal = breakdown.reduce((a, b) => a + b.value, 0);
  const first = ((user.user_metadata?.["full_name"] as string | undefined) ?? user.email ?? "").split(/[\s@]/)[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <AppShell title="Dashboard">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{greet}{first ? `, ${first}` : ""}!</h2>
          <p className="text-sm text-muted-foreground">Track your cash flow and stay in control of your budget.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportCsv(txns)} disabled={!txns.length}><Download className="h-4 w-4" /> Export</Button>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Transaction</Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat icon={Wallet} tone="bg-primary" label="Net cash flow (this month)" value={inr(net)} />
            <Stat icon={ArrowDownLeft} tone="bg-chart-2" label="Monthly income" value={inr(income)} />
            <Stat icon={ArrowUpRight} tone="bg-chart-5" label="Monthly expenses" value={inr(expense)} />
            <Stat icon={PiggyBank} tone="bg-chart-4" label="Savings rate" value={`${income ? Math.round((net / income) * 100) : 0}%`} />
          </div>

          <Card>
            <p className="text-sm font-semibold">Cash flow · last 6 months</p>
            <div className="mt-4 h-64">
              <ResponsiveContainer>
                <AreaChart data={trend} margin={{ left: -10, right: 4 }}>
                  <defs>
                    <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} /></linearGradient>
                    <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary-glow)" stopOpacity={0.25} /><stop offset="100%" stopColor="var(--primary-glow)" stopOpacity={0.02} /></linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip formatter={(v: number) => inr(v)} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
                  <Area type="monotone" dataKey="income" stroke="var(--primary)" strokeWidth={2} fill="url(#gi)" />
                  <Area type="monotone" dataKey="expense" stroke="var(--primary-glow)" strokeWidth={2} fill="url(#ge)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">Recent transactions</p><Link to="/transactions" className="text-sm text-primary hover:underline">View all</Link></div>
            {txns.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No transactions yet — add your first one.</p>
            ) : (
              <table className="w-full text-sm"><tbody>
                {txns.slice(0, 6).map((t) => {
                  const Icon = ICONS[t.category] ?? Receipt;
                  return (
                    <tr key={t.id} className="border-t first:border-t-0">
                      <td className="py-3"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Icon className="h-4 w-4" /></span><span className="font-medium">{t.description}</span></div></td>
                      <td className="text-muted-foreground">{fmtDate(t.date)}</td>
                      <td className={`text-right font-semibold num ${t.type === "income" ? "text-success" : ""}`}>{t.type === "income" ? "+" : "−"}{inr(t.amount)}</td>
                    </tr>
                  );
                })}
              </tbody></table>
            )}
          </Card>
        </div>

        <Card>
          <p className="text-sm font-semibold">Statistics · this month</p>
          <Tabs value={statTab} onValueChange={(v) => setStatTab(v as "income" | "expense")} className="mt-3">
            <TabsList className="w-full"><TabsTrigger value="expense" className="flex-1">Expense</TabsTrigger><TabsTrigger value="income" className="flex-1">Income</TabsTrigger></TabsList>
          </Tabs>
          <div className="relative mt-4 h-52">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={breakdown.length ? breakdown : [{ name: "none", value: 1 }]} dataKey="value" startAngle={200} endAngle={-20} innerRadius={70} outerRadius={88} paddingAngle={3} cornerRadius={8} stroke="none">
                  {(breakdown.length ? breakdown : [0]).map((_, i) => <Cell key={i} fill={breakdown.length ? `var(--chart-${(i % 5) + 1})` : "var(--muted)"} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div><p className="text-xs text-muted-foreground">Total {statTab}</p><p className="text-xl font-bold num">{inr(breakdownTotal)}</p></div>
            </div>
          </div>
          <ul className="mt-2 space-y-2">
            {breakdown.map((b, i) => (
              <li key={b.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full" style={{ background: `var(--chart-${(i % 5) + 1})` }} />{b.name}</span>
                <span className="font-semibold num">{inr(b.value)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <AddDialog open={open} onOpenChange={setOpen} />
    </AppShell>
  );
}

function Stat({ icon: Icon, tone, label, value }: { icon: typeof Wallet; tone: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <span className={`grid h-8 w-8 place-items-center rounded-lg text-primary-foreground ${tone}`}><Icon className="h-4 w-4" /></span>
      <p className="mt-4 text-xl font-bold num">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
