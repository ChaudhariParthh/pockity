import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { AppShell, Card } from "@/components/AppShell";
import { inr, monthlyTrend, txnsQuery } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Pockity" },
      { name: "description", content: "Monthly income vs expenses and top spending categories." },
      { property: "og:title", content: "Analytics — Pockity" },
      { property: "og:description", content: "Monthly income vs expenses and top spending categories." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(txnsQuery),
  component: Analytics,
});

function Analytics() {
  const { data: txns } = useSuspenseQuery(txnsQuery);
  const trend = monthlyTrend(txns, 12);
  const cats: Record<string, number> = {};
  txns.filter((t) => t.type === "expense").forEach((t) => (cats[t.category] = (cats[t.category] ?? 0) + t.amount));
  const top = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const max = top[0]?.[1] ?? 1;
  const totalIn = txns.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
  const totalOut = txns.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0);

  return (
    <AppShell title="Analytics">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><p className="text-xs text-muted-foreground">All-time income</p><p className="mt-1 text-xl font-bold num">{inr(totalIn)}</p></Card>
        <Card><p className="text-xs text-muted-foreground">All-time expenses</p><p className="mt-1 text-xl font-bold num">{inr(totalOut)}</p></Card>
        <Card><p className="text-xs text-muted-foreground">Net saved</p><p className="mt-1 text-xl font-bold text-primary num">{inr(totalIn - totalOut)}</p></Card>
      </div>
      <Card>
        <p className="text-sm font-semibold">Income vs expenses · last 12 months</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer>
            <BarChart data={trend} margin={{ left: -10 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
              <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v: number) => inr(v)} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" name="Expenses" fill="var(--chart-5)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card>
        <p className="mb-4 text-sm font-semibold">Top spending categories</p>
        {top.length === 0 ? <p className="text-sm text-muted-foreground">No expenses recorded yet.</p> : (
          <ul className="space-y-3">
            {top.map(([name, v]) => (
              <li key={name}>
                <div className="flex justify-between text-sm"><span>{name}</span><span className="font-semibold num">{inr(v)}</span></div>
                <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${(v / max) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
