import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useApp } from "@/context/app-context";
import { fmt, shortDate } from "@/lib/format";

export const Route = createFileRoute("/transactions")({ component: Transactions });

function Transactions() {
  const { txs } = useApp();
  return (
    <DashboardShell title="Transactions">
      <div className="glass rounded-2xl">
        {txs.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No transactions yet.</div>
        ) : (
          <ul className="divide-y">
            {txs.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-5 py-4 text-sm">
                <div>
                  <div className="font-medium">{t.note}</div>
                  <div className="text-xs text-muted-foreground">{shortDate(t.at)} · {t.type} · <span className={t.status === "failed" ? "text-destructive" : t.status === "pending" ? "text-accent" : "text-emerald-500"}>{t.status}</span></div>
                </div>
                <div className={t.status === "failed" ? "line-through text-muted-foreground" : ""}>{fmt(t.amount)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}