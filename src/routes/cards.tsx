import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useApp } from "@/context/app-context";
import { fmt } from "@/lib/format";
import { Snowflake, Settings2 } from "lucide-react";

export const Route = createFileRoute("/cards")({ component: Cards });

function Cards() {
  const { user } = useApp();
  if (!user) return null;
  const grad = user.tier === "Legend" ? "gradient-legend" : user.tier === "Gold" ? "gradient-gold" : "gradient-card";
  return (
    <DashboardShell title="Cards">
      <div className="mx-auto max-w-md space-y-4">
        <div className={`rounded-3xl ${grad} p-6 text-white shadow-elegant`}>
          <div className="flex justify-between text-xs uppercase tracking-widest opacity-80">
            <span>CrestVest {user.tier}</span>
            <span>VISA</span>
          </div>
          <div className="mt-10 font-mono text-xl tracking-widest">•••• •••• •••• 4242</div>
          <div className="mt-6 flex justify-between text-xs">
            <div><div className="opacity-70">Cardholder</div><div>{user.firstName} {user.lastName}</div></div>
            <div><div className="opacity-70">Balance</div><div className="font-semibold">{fmt(user.cardBalance)}</div></div>
            <div><div className="opacity-70">Exp</div><div>12/29</div></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 rounded-xl border py-3 text-sm"><Snowflake className="h-4 w-4" /> Freeze card</button>
          <button className="flex items-center justify-center gap-2 rounded-xl border py-3 text-sm"><Settings2 className="h-4 w-4" /> Limits</button>
        </div>
        <div className="glass rounded-2xl p-5 text-sm">
          <div className="font-semibold">Where can I use my CrestVest card?</div>
          <p className="mt-1 text-muted-foreground">Your card works exclusively inside the CrestVest ecosystem — for the internal <Link to="/store" className="text-primary underline-offset-4 hover:underline">Store</Link> and plan upgrades. Balance is topped up from your main account.</p>
        </div>
      </div>
    </DashboardShell>
  );
}