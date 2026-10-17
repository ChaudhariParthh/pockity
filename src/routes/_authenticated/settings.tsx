import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppShell, Card, useSignOut } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Pockity" },
      { name: "description", content: "Manage your Pockity profile and password." },
      { property: "og:title", content: "Settings — Pockity" },
      { property: "og:description", content: "Manage your Pockity profile and password." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = Route.useRouteContext();
  const router = useRouter();
  const signOut = useSignOut();
  const [name, setName] = useState((user.user_metadata?.full_name as string) ?? "");
  const [current, setCurrent] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  const saveName = async () => {
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim().slice(0, 60) } });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Name updated");
    router.invalidate();
  };
  const savePw = async () => {
    if (pw.length < 8) return toast.error("Password must be at least 8 characters.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw, current_password: current } as Parameters<typeof supabase.auth.updateUser>[0]);
    setBusy(false);
    if (error) return toast.error(error.message);
    setPw(""); setCurrent("");
    toast.success("Password changed");
  };

  return (
    <AppShell title="Settings">
      <Card className="max-w-lg">
        <p className="font-semibold">Profile</p>
        <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
        <div className="mt-4 grid gap-1.5"><Label htmlFor="n">Display name</Label><Input id="n" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} /></div>
        <Button className="mt-3" onClick={saveName} disabled={busy}>Save name</Button>
      </Card>
      <Card className="max-w-lg">
        <p className="font-semibold">Change password</p>
        <p className="text-sm text-muted-foreground">Signed in with Google? You can skip this.</p>
        <div className="mt-4 grid gap-3">
          <div className="grid gap-1.5"><Label htmlFor="c">Current password</Label><Input id="c" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} /></div>
          <div className="grid gap-1.5"><Label htmlFor="p">New password</Label><Input id="p" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        </div>
        <Button className="mt-3" onClick={savePw} disabled={busy}>Update password</Button>
      </Card>
      <Card className="max-w-lg">
        <p className="font-semibold">Session</p>
        <Button variant="destructive" className="mt-3" onClick={signOut}>Log out</Button>
      </Card>
    </AppShell>
  );
}
