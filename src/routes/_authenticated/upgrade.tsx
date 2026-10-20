import { createFileRoute } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell, Card } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/upgrade")({
  head: () => ({
    meta: [
      { title: "Pockity Pro" },
      { name: "description", content: "Smart insights, budgeting tools and custom reports with Pockity Pro." },
      { property: "og:title", content: "Pockity Pro" },
      { property: "og:description", content: "Smart insights, budgeting tools and custom reports with Pockity Pro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Upgrade,
});

function Upgrade() {
  return (
    <AppShell title="Upgrade">
      <Card className="max-w-lg">
        <Sparkles className="h-6 w-6 text-primary" />
        <h2 className="mt-2 text-2xl font-bold">Pockity Pro</h2>
        <p className="text-sm text-muted-foreground">Coming soon.</p>
        <ul className="mt-4 space-y-2 text-sm">
          {["Monthly budgets with alerts", "Smart spending insights", "Custom PDF reports", "Recurring payments"].map((f) => (
            <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{f}</li>
          ))}
        </ul>
        <Button className="mt-5 w-full" disabled>Notify me — coming soon</Button>
      </Card>
    </AppShell>
  );
}
