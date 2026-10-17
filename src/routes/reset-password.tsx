import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Pockity" },
      { name: "description", content: "Choose a new password for your Pockity account." },
      { property: "og:title", content: "Set a new password — Pockity" },
      { property: "og:description", content: "Choose a new password for your Pockity account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error("This reset link is invalid or expired. Request a new one.");
    toast.success("Password updated");
    navigate({ to: "/dashboard", replace: true });
  };
  return (
    <div className="grid min-h-screen place-items-center bg-brand-dark px-4 font-sans">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-card">
        <h1 className="text-xl font-bold">Set a new password</h1>
        <div className="mt-4 grid gap-1.5"><Label htmlFor="pw">New password</Label><Input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <Button type="submit" className="mt-4 w-full" disabled={busy}>Update password</Button>
      </form>
    </div>
  );
}
