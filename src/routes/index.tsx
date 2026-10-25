import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BarChart3, ShieldCheck, Wallet } from "lucide-react";
import logoWhite from "@/assets/pockity-logo-white.png";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pockity — Your money, in your pocket" },
      { name: "description", content: "Track income, expenses and monthly cash flow in ₹ with Pockity. Free, private and simple." },
      { property: "og:title", content: "Pockity — Your money, in your pocket" },
      { property: "og:description", content: "Track income, expenses and monthly cash flow in ₹ with Pockity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();

  // Signed-in visitors skip the landing page and go straight to the dashboard.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-brand-dark font-sans text-brand-dark-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <img src={logoWhite} alt="Pockity" className="h-9 w-auto" />
        <Button asChild variant="secondary"><Link to="/auth">Sign in</Link></Button>
      </header>
      <section className="mx-auto max-w-3xl px-6 pb-16 pt-16 text-center">
        <img src={logoWhite} alt="" className="mx-auto w-72 animate-in zoom-in-95 duration-700" />
        <h1 className="mt-8 text-4xl font-extrabold tracking-tight md:text-5xl">Your money, in your pocket.</h1>
        <p className="mx-auto mt-4 max-w-xl opacity-80">Log income and expenses in seconds, see where every rupee goes, and watch your savings grow.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg"><Link to="/auth" search={{ mode: "signup" }}>Get started free</Link></Button>
          <Button asChild size="lg" variant="secondary"><Link to="/auth">I have an account</Link></Button>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-24 md:grid-cols-3">
        {[
          [Wallet, "Track everything", "Income and expenses by category, in ₹."],
          [BarChart3, "See the trends", "Monthly cash flow and top spending at a glance."],
          [ShieldCheck, "Private by design", "Only you can see your transactions."],
        ].map(([Icon, t, d]) => {
          const I = Icon as typeof Wallet;
          return (
            <div key={t as string} className="rounded-2xl border border-brand-dark-foreground/15 p-6">
              <I className="h-6 w-6 text-primary-glow" />
              <p className="mt-3 font-semibold">{t as string}</p>
              <p className="mt-1 text-sm opacity-75">{d as string}</p>
            </div>
          );
        })}
      </section>
      <footer className="border-t border-brand-dark-foreground/15">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-1.5 px-6 py-8 text-center">
          <p className="text-sm opacity-70">© {new Date().getFullYear()} Pockity. All rights reserved.</p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] opacity-50">Developed by Parth</p>
        </div>
      </footer>
    </div>
  );
}
