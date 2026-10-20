import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import logoWhite from "@/assets/pockity-logo-white.png";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { safeRedirect } from "@/lib/finance";

type Mode = "signin" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: Mode | undefined; redirect?: string | undefined } => ({
    mode: s["mode"] === "signup" || s["mode"] === "forgot" ? s["mode"] : undefined,
    redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Pockity" },
      { name: "description", content: "Sign in or create your free Pockity account." },
      { property: "og:title", content: "Sign in — Pockity" },
      { property: "og:description", content: "Sign in or create your free Pockity account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const dest = safeRedirect(search.redirect);

  useEffect(() => {
    setConfirm("");
    const go = () => navigate({ to: dest, replace: true });
    supabase.auth.getSession().then(({ data }) => data.session && go());
    const { data } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s) go(); });
    return () => data.subscription.unsubscribe();
  }, [dest, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice("");
    if (!/^\S+@\S+\.\S+$/.test(email)) { toast.error("Enter a valid email."); return; }
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setNotice("If an account exists, a reset link is on its way to your inbox.");
      } else if (mode === "signup") {
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");
        if (password !== confirm) throw new Error("Passwords don't match. Please retype it.");
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name.trim().slice(0, 60) } } });
        if (error) throw error;
        setNotice("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (res.error) toast.error("Google sign-in failed. Please try again.");
  };

  return (
    <div className="grid min-h-screen place-items-center bg-brand-dark px-4 font-sans">
      <div className="w-full max-w-sm">
        <Link to="/" aria-label="Pockity home"><img src={logoWhite} alt="Pockity" className="mx-auto mb-6 w-48" /></Link>
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <h1 className="text-xl font-bold">{mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back"}</h1>
          {mode !== "forgot" && (
            <>
              <Button type="button" variant="outline" className="mt-5 w-full" onClick={google}>Continue with Google</Button>
              <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
            </>
          )}
          <form onSubmit={submit} className={`grid gap-3 ${mode === "forgot" ? "mt-5" : ""}`}>
            {mode === "signup" && <div className="grid gap-1.5"><Label htmlFor="name">Name</Label><Input id="name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></div>}
            <div className="grid gap-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" required maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
            {mode !== "forgot" && <div className="grid gap-1.5"><Label htmlFor="pw">Password</Label><PasswordInput id="pw" required minLength={mode === "signup" ? 8 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} /></div>}
            {mode === "signup" && <div className="grid gap-1.5"><Label htmlFor="pw-confirm">Retype password</Label><PasswordInput id="pw-confirm" required value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" /></div>}
            {notice && <p className="rounded-lg bg-muted p-3 text-sm">{notice}</p>}
            <Button type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}</Button>
          </form>
          <div className="mt-4 space-y-1 text-center text-sm text-muted-foreground">
            {mode === "signin" && <>
              <button className="text-primary hover:underline" onClick={() => setMode("forgot")}>Forgot password?</button>
              <p>New to Pockity? <button className="text-primary hover:underline" onClick={() => setMode("signup")}>Create an account</button></p>
            </>}
            {mode !== "signin" && <p>Already have an account? <button className="text-primary hover:underline" onClick={() => setMode("signin")}>Sign in</button></p>}
          </div>
        </div>
      </div>
    </div>
  );
}
