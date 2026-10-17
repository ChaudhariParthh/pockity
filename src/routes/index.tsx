import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import {
  LayoutDashboard, ArrowLeftRight, BarChart3, Wallet, CalendarRange, FileText, Settings, HelpCircle, LogOut,
  Search, Bell, Plus, Download, TrendingUp, TrendingDown, PiggyBank, ArrowDownLeft, ArrowUpRight,
  Utensils, Bus, ShoppingBag, Receipt, Film, Home, Briefcase, Laptop, Sparkles, PanelLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pockity" },
      { name: "description", content: "Track income, expenses and monthly cash flow in ₹ with Pockity." },
      { property: "og:title", content: "Pockity — Personal finance dashboard" },
      { property: "og:description", content: "Track income, expenses and monthly cash flow in ₹ with Pockity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

type Txn = { id: string; description: string; amount: number; type: "income" | "expense"; category: string; date: string };

const EXPENSE_CATS = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Healthcare", "Education", "Housing", "Personal Care", "Subscriptions", "Other"];
const INCOME_CATS = ["Salary", "Freelance", "Business", "Investments", "Other"];
const ICONS: Record<string, typeof Utensils> = {
  Food: Utensils, Transport: Bus, Shopping: ShoppingBag, Bills: Receipt, Entertainment: Film, Housing: Home,
  Subscriptions: Sparkles, Salary: Briefcase, Freelance: Laptop,
};

const SEED: Txn[] = [
  { id: "1", description: "Monthly salary", amount: 85000, type: "income", category: "Salary", date: "2026-10-01" },
  { id: "2", description: "Flat rent", amount: 22000, type: "expense", category: "Housing", date: "2026-10-02" },
  { id: "3", description: "Logo design project", amount: 15000, type: "income", category: "Freelance", date: "2026-10-05" },
  { id: "4", description: "Swiggy dinner", amount: 640, type: "expense", category: "Food", date: "2026-10-08" },
  { id: "5", description: "Electricity bill", amount: 1850, type: "expense", category: "Bills", date: "2026-10-10" },
  { id: "6", description: "Netflix", amount: 649, type: "expense", category: "Subscriptions", date: "2026-10-12" },
  { id: "7", description: "Metro card recharge", amount: 1000, type: "expense", category: "Transport", date: "2026-10-14" },
  { id: "8", description: "Myntra order", amount: 3299, type: "expense", category: "Shopping", date: "2026-10-15" },
  { id: "9", description: "Movie tickets", amount: 900, type: "expense", category: "Entertainment", date: "2026-10-16" },
];

const TREND = [
  { m: "Jan", income: 82000, expense: 51000 }, { m: "Feb", income: 84000, expense: 47000 },
  { m: "Mar", income: 79000, expense: 56000 }, { m: "Apr", income: 91000, expense: 49000 },
  { m: "May", income: 86000, expense: 61000 }, { m: "Jun", income: 98000, expense: 52000 },
  { m: "Jul", income: 87000, expense: 58000 }, { m: "Aug", income: 92000, expense: 54000 },
  { m: "Sep", income: 95000, expense: 50000 },
];

const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

function Dashboard() {
  const [txns, setTxns] = useState<Txn[]>(SEED);
  const [open, setOpen] = useState(false);
  const [statTab, setStatTab] = useState<"income" | "expense">("expense");
  const [query, setQuery] = useState("");

  const income = txns.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
  const expense = txns.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0);
  const net = income - expense;
  const trend = [...TREND, { m: "Oct", income, expense }];

  const breakdown = useMemo(() => {
    const map: Record<string, number> = {};
    txns.filter((t) => t.type === statTab).forEach((t) => (map[t.category] = (map[t.category] ?? 0) + t.amount));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [txns, statTab]);
  const breakdownTotal = breakdown.reduce((a, b) => a + b.value, 0);

  const visible = [...txns].sort((a, b) => b.date.localeCompare(a.date)).filter((t) => t.description.toLowerCase().includes(query.toLowerCase()));
  const upcoming = [
    { d: "20", name: "Netflix", cat: "Subscriptions", amt: 649 },
    { d: "22", name: "Airtel Wi‑Fi", cat: "Bills", amt: 999 },
    { d: "25", name: "Spotify Premium", cat: "Subscriptions", amt: 119 },
    { d: "28", name: "Gym membership", cat: "Personal Care", amt: 1500 },
  ];

  const exportCsv = () => {
    const rows = [["Date", "Description", "Type", "Category", "Amount"], ...txns.map((t) => [t.date, t.description, t.type, t.category, String(t.amount)])];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "pockity-transactions.csv"; a.click();
  };

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b bg-card px-6">
          <h1 className="text-base font-semibold">Dashboard</h1>
          <div className="ml-auto hidden items-center gap-2 rounded-lg border bg-muted px-3 py-2 md:flex">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search transactions…" className="w-56 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <Button variant="outline" size="icon" aria-label="Notifications"><Bell className="h-4 w-4" /></Button>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground">PC</div>
        </header>

        <main className="space-y-5 p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Good evening, Parth!</h2>
              <p className="text-sm text-muted-foreground">Track your cash flow and stay in control of your budget.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" /> Export</Button>
              <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Transaction</Button>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
            <div className="min-w-0 space-y-5">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Stat icon={Wallet} tone="bg-primary" label="Net cash flow (Oct)" value={inr(net)} delta="+8.2%" up />
                <Stat icon={ArrowDownLeft} tone="bg-chart-2" label="Monthly income" value={inr(income)} delta="+4.1%" up />
                <Stat icon={ArrowUpRight} tone="bg-chart-5" label="Monthly expenses" value={inr(expense)} delta="-2.5%" />
                <Stat icon={PiggyBank} tone="bg-chart-4" label="Savings rate" value={`${income ? Math.round((net / income) * 100) : 0}%`} delta="+5.3%" up />
              </div>

              <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
                <Card>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold">Cash flow</p>
                      <p className="mt-2 text-2xl font-bold text-primary num">{inr(trend.reduce((a, t) => a + t.income - t.expense, 0))}</p>
                      <p className="text-xs text-muted-foreground">Net saved this year · not a bank balance</p>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-primary" />Income</span>
                      <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-primary-glow opacity-50" />Expenses</span>
                    </div>
                  </div>
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
                  <p className="mb-3 text-sm font-semibold">Upcoming payments</p>
                  <div className="space-y-2">
                    {upcoming.map((u) => (
                      <div key={u.name} className="flex items-center gap-3 rounded-xl border p-2.5">
                        <div className="grid w-10 rounded-lg bg-muted py-1 text-center leading-tight">
                          <span className="text-sm font-bold">{u.d}</span><span className="text-[10px] text-muted-foreground">Oct</span>
                        </div>
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.cat}</p></div>
                        <span className="text-sm font-semibold num">{inr(u.amt)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <Card>
                <p className="mb-3 text-sm font-semibold">Transaction history</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      {visible.map((t) => {
                        const Icon = ICONS[t.category] ?? Receipt;
                        return (
                          <tr key={t.id} className="border-t first:border-t-0">
                            <td className="py-3"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Icon className="h-4 w-4" /></span><span className="font-medium">{t.description}</span></div></td>
                            <td className="text-muted-foreground">{fmtDate(t.date)}</td>
                            <td className="text-muted-foreground">{t.category}</td>
                            <td className={`text-right font-semibold num ${t.type === "income" ? "text-success" : "text-foreground"}`}>{t.type === "income" ? "+" : "−"}{inr(t.amount)}</td>
                          </tr>
                        );
                      })}
                      {visible.length === 0 && <tr><td className="py-8 text-center text-muted-foreground">No transactions match your search.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            <Card>
              <div className="flex items-center justify-between"><p className="text-sm font-semibold">Statistics</p><span className="text-xs text-muted-foreground">October</span></div>
              <Tabs value={statTab} onValueChange={(v) => setStatTab(v as "income" | "expense")} className="mt-3">
                <TabsList className="w-full"><TabsTrigger value="expense" className="flex-1">Expense</TabsTrigger><TabsTrigger value="income" className="flex-1">Income</TabsTrigger></TabsList>
              </Tabs>
              <div className="relative mt-4 h-52">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={breakdown} dataKey="value" startAngle={200} endAngle={-20} innerRadius={70} outerRadius={88} paddingAngle={3} cornerRadius={8} stroke="none">
                      {breakdown.map((_, i) => <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />)}
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
        </main>
      </div>

      <AddDialog open={open} onOpenChange={setOpen} onAdd={(t) => { setTxns((x) => [t, ...x]); toast.success("Transaction added"); }} />
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border bg-card p-5 shadow-card">{children}</div>;
}

function Stat({ icon: Icon, tone, label, value, delta, up }: { icon: typeof Wallet; tone: string; label: string; value: string; delta: string; up?: boolean }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between rounded-xl bg-muted p-2">
        <span className={`grid h-8 w-8 place-items-center rounded-lg text-primary-foreground ${tone}`}><Icon className="h-4 w-4" /></span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">{up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{delta} vs last month</span>
      </div>
      <p className="mt-4 text-xl font-bold num">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Sidebar() {
  const groups = [
    { title: "Overview", items: [[LayoutDashboard, "Dashboard"], [ArrowLeftRight, "Transactions"], [BarChart3, "Analytics"], [Wallet, "Budgets"], [CalendarRange, "Planning"]] },
    { title: "Reports", items: [[FileText, "Generate report"]] },
    { title: "Others", items: [[Settings, "Settings"], [HelpCircle, "Help"]] },
  ] as const;
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-sidebar lg:flex">
      <div className="flex h-16 items-center gap-2 px-5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary font-extrabold text-primary-foreground">P</span>
        <span className="text-lg font-bold">Pockity</span>
        <PanelLeft className="ml-auto h-4 w-4 text-muted-foreground" />
      </div>
      <nav className="flex-1 space-y-5 px-3 py-4">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="px-3 pb-2 text-xs text-muted-foreground">{g.title}</p>
            {g.items.map(([Icon, name]) => (
              <button key={name} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm ${name === "Dashboard" ? "bg-sidebar-accent font-semibold text-primary" : "text-sidebar-foreground hover:bg-muted"}`}>
                <Icon className="h-4 w-4" />{name}
              </button>
            ))}
          </div>
        ))}
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-muted"><LogOut className="h-4 w-4" />Log out</button>
      </nav>
      <div className="m-3 rounded-2xl bg-gradient-primary p-4 text-primary-foreground">
        <Sparkles className="h-5 w-5" />
        <p className="mt-2 font-semibold">Pockity Pro</p>
        <p className="mt-1 text-xs opacity-80">Smart insights, budgeting tools and custom reports.</p>
        <Button variant="secondary" size="sm" className="mt-3 w-full">Upgrade</Button>
      </div>
    </aside>
  );
}

function AddDialog({ open, onOpenChange, onAdd }: { open: boolean; onOpenChange: (o: boolean) => void; onAdd: (t: Txn) => void }) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const cats = type === "income" ? INCOME_CATS : EXPENSE_CATS;

  const submit = () => {
    const amt = Number(amount);
    if (!description.trim() || description.length > 100) return setError("Enter a description (max 100 characters).");
    if (!(amt > 0) || amt > 1e9) return setError("Amount must be a positive number.");
    onAdd({ id: crypto.randomUUID(), description: description.trim(), amount: Math.round(amt * 100) / 100, type, category, date });
    setDescription(""); setAmount(""); setError(""); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add transaction</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <Tabs value={type} onValueChange={(v) => { setType(v as "income" | "expense"); setCategory(v === "income" ? "Salary" : "Food"); }}>
            <TabsList className="w-full"><TabsTrigger value="expense" className="flex-1">Expense</TabsTrigger><TabsTrigger value="income" className="flex-1">Income</TabsTrigger></TabsList>
          </Tabs>
          <div className="grid gap-1.5"><Label htmlFor="d">Description</Label><Input id="d" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Groceries" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label htmlFor="a">Amount (₹)</Label><Input id="a" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label htmlFor="dt">Date</Label><Input id="dt" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <div className="grid gap-1.5"><Label>Category</Label>
            <Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
