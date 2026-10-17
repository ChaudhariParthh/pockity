import { Link, useNavigate, useRouteContext } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, ArrowLeftRight, BarChart3, Settings, LogOut, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import logoWhite from "@/assets/pockity-logo-white.png";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function useSignOut() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}

export function AppShell({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const signOut = useSignOut();
  const name = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "You";
  const initials = name.split(/[\s@]/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-sidebar lg:flex">
        <Link to="/dashboard" className="m-3 flex h-14 items-center rounded-xl bg-brand-dark px-3" aria-label="Pockity home">
          <img src={logoWhite} alt="Pockity" className="h-8 w-auto" />
        </Link>
        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
              activeProps={{ className: "bg-sidebar-accent font-semibold text-primary" }}>
              <Icon className="h-4 w-4" />{label}
            </Link>
          ))}
          <button onClick={signOut} className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-muted">
            <LogOut className="h-4 w-4" />Log out
          </button>
        </nav>
        <div className="m-3 rounded-2xl bg-gradient-primary p-4 text-primary-foreground">
          <Sparkles className="h-5 w-5" />
          <p className="mt-2 font-semibold">Pockity Pro</p>
          <p className="mt-1 text-xs opacity-80">Smart insights, budgeting tools and custom reports.</p>
          <Button asChild variant="secondary" size="sm" className="mt-3 w-full"><Link to="/upgrade">Upgrade</Link></Button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b bg-card px-6">
          <h1 className="text-base font-semibold">{title}</h1>
          <div className="ml-auto flex items-center gap-2">{actions}</div>
          <Link to="/settings" aria-label="Account settings" className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground">{initials}</Link>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b bg-card px-4 py-2 lg:hidden" aria-label="Main mobile">
          {NAV.map(({ to, label }) => (
            <Link key={to} to={to} className="rounded-md px-3 py-1.5 text-sm text-muted-foreground" activeProps={{ className: "bg-sidebar-accent font-semibold text-primary" }}>{label}</Link>
          ))}
          <button onClick={signOut} className="rounded-md px-3 py-1.5 text-sm text-destructive">Log out</button>
        </nav>
        <main className="space-y-5 p-6">{children}</main>
      </div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border bg-card p-5 shadow-card ${className}`}>{children}</div>;
}
