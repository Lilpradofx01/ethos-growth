import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useApp } from "@/context/app-context";
import { fmt } from "@/lib/format";

export const Route = createFileRoute("/savings")({ component: SavingsPage });

function SavingsPage() {
  const { user } = useApp();
  if (!user) return null;
  const goals = [
    { name: "Emergency fund", target: 5000, saved: Math.min(user.balances.savings, 5000) },
    { name: "Vacation", target: 2000, saved: 400 },
    { name: "New laptop", target: 1500, saved: 250 },
  ];
  return (
    <DashboardShell title="Savings">
      <div className="mb-4 rounded-2xl gradient-emerald p-6 text-white shadow-elegant">
        <div className="text-xs opacity-80">Total savings</div>
        <div className="text-3xl font-bold">{fmt(user.balances.savings)}</div>
        <Link to="/transfer" className="mt-3 inline-block rounded-lg bg-white/20 px-3 py-1.5 text-xs">Move money in</Link>
      </div>
      <div className="space-y-3">
        {goals.map((g) => {
          const pct = Math.min(100, (g.saved / g.target) * 100);
          return (
            <div key={g.name} className="glass rounded-2xl p-5">
              <div className="flex justify-between"><span className="font-semibold">{g.name}</span><span className="text-sm text-muted-foreground">{fmt(g.saved)} / {fmt(g.target)}</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full gradient-emerald" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}