import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useApp } from "@/context/app-context";
import { Moon, Sun, LogOut } from "lucide-react";

export const Route = createFileRoute("/settings")({ component: Settings });

function Settings() {
  const { user, theme, toggleTheme, logout } = useApp();
  const nav = useNavigate();
  if (!user) return null;
  return (
    <DashboardShell title="Settings">
      <div className="space-y-4">
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold">Profile</h3>
          <div className="mt-3 grid gap-2 text-sm">
            <Row k="Name" v={`${user.firstName} ${user.lastName}`} />
            <Row k="Email (account ID)" v={user.email} />
            <Row k="Phone" v={user.phone || "—"} />
            <Row k="Tier" v={user.tier} />
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold">Appearance</h3>
          <button onClick={toggleTheme} className="mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} Switch to {theme === "dark" ? "light" : "dark"} mode
          </button>
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold">Language</h3>
          <select defaultValue="en" className="mt-2 rounded-lg border bg-background px-3 py-2 text-sm">
            <option value="en">English</option><option value="es">Español</option><option value="fr">Français</option><option value="ar">العربية</option>
          </select>
        </div>
        <div className="glass rounded-2xl p-5 text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{user.email}</span>
          <button onClick={() => { logout(); nav({ to: "/" }); }} className="mt-3 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-destructive">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between border-b py-2 last:border-0"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>;
}