import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { useApp } from "@/context/app-context";
import { fmt } from "@/lib/format";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Lock, Plus } from "lucide-react";

export const Route = createFileRoute("/invest")({ component: Invest });

type Asset = { sym: string; name: string; price: number; owned: number };

const VAULTS = [
  { plan: "Starter" as const, days: 30, apy: 5 },
  { plan: "Growth" as const, days: 90, apy: 8 },
  { plan: "Legend" as const, days: 180, apy: 12 },
];

function Invest() {
  const { user, vaults, buyVault, addFundsToInvest } = useApp();
  const [assets, setAssets] = useState<Asset[]>([
    { sym: "AAPL", name: "Apple Inc.", price: 189.4, owned: 10 },
    { sym: "MSFT", name: "Microsoft", price: 412.3, owned: 5 },
    { sym: "HYDF", name: "High-Yield Dollar Fund", price: 100, owned: 20 },
  ]);
  const [prev, setPrev] = useState<Record<string, number>>({});
  const [cash, setCash] = useState(5000);
  const [openVault, setOpenVault] = useState<null | typeof VAULTS[number]>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [vaultAmt, setVaultAmt] = useState("");
  const [addAmt, setAddAmt] = useState("");

  useEffect(() => {
    const id = setInterval(() => {
      setAssets((a) => {
        setPrev(Object.fromEntries(a.map((x) => [x.sym, x.price])));
        return a.map((x) => {
          const drift = (Math.random() - 0.48) * 0.012;
          return { ...x, price: Math.max(1, +(x.price * (1 + drift)).toFixed(2)) };
        });
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const totalValue = useMemo(() => cash + assets.reduce((s, a) => s + a.price * a.owned, 0), [assets, cash]);
  const costBasis = 5000 + 10 * 189.4 + 5 * 412.3 + 20 * 100;
  const pnl = totalValue - costBasis;

  const trade = (sym: string, side: "buy" | "sell") => {
    setAssets((a) =>
      a.map((x) => {
        if (x.sym !== sym) return x;
        if (side === "buy") {
          if (cash < x.price) { toast.error("Not enough cash"); return x; }
          setCash((c) => c - x.price);
          return { ...x, owned: x.owned + 1 };
        }
        if (x.owned <= 0) { toast.error("You don't own any"); return x; }
        setCash((c) => c + x.price);
        return { ...x, owned: x.owned - 1 };
      }),
    );
  };

  const confirmVault = async () => {
    if (!openVault) return;
    try { await buyVault(openVault.plan, Number(vaultAmt)); toast.success("Vault opened"); setOpenVault(null); setVaultAmt(""); }
    catch (e) { toast.error((e as Error).message); }
  };
  const confirmAdd = async () => {
    try { await addFundsToInvest(Number(addAmt)); toast.success("Funds moved to investment"); setOpenAdd(false); setAddAmt(""); }
    catch (e) { toast.error((e as Error).message); }
  };

  if (!user) return null;
  return (
    <DashboardShell title="Investments">
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <Stat label="Portfolio value" value={fmt(totalValue)} />
          <Stat label="Available cash" value={fmt(cash)} action={<button onClick={() => setOpenAdd(true)} className="mt-1 inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs text-primary"><Plus className="h-3 w-3" /> Add funds</button>} />
          <Stat label="Total P&L" value={fmt(pnl)} tone={pnl >= 0 ? "up" : "down"} />
        </div>

        <div className="glass rounded-2xl">
          <div className="border-b px-5 py-3 text-sm font-semibold">Live market</div>
          <ul className="divide-y">
            {assets.map((a) => {
              const p = prev[a.sym] ?? a.price;
              const up = a.price >= p;
              return (
                <li key={a.sym} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm">
                  <div>
                    <div className="font-semibold">{a.sym} <span className="text-xs text-muted-foreground">· {a.name}</span></div>
                    <div className="text-xs text-muted-foreground">Owned: {a.owned}</div>
                  </div>
                  <div className={`flex items-center gap-1 font-mono ${up ? "text-emerald-500" : "text-destructive"}`}>
                    {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />} {fmt(a.price)}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => trade(a.sym, "buy")} className="rounded-md gradient-primary px-3 py-1 text-xs text-primary-foreground">Buy</button>
                    <button onClick={() => trade(a.sym, "sell")} className="rounded-md border px-3 py-1 text-xs">Sell</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-semibold">Grow your wealth — Vaults</h3>
          <div className="grid gap-3 md:grid-cols-3">
            {VAULTS.map((v) => (
              <div key={v.plan} className="glass rounded-2xl p-5">
                <div className="text-lg font-bold">{v.plan} Vault</div>
                <div className="text-xs text-muted-foreground">{v.days} days · {v.apy}% APY</div>
                <div className="mt-4 text-3xl font-bold text-primary">{v.apy}%</div>
                <button onClick={() => setOpenVault(v)} className="mt-4 w-full rounded-lg gradient-primary py-2 text-sm font-medium text-primary-foreground">Invest now</button>
              </div>
            ))}
          </div>
        </div>

        {vaults.length > 0 && (
          <div>
            <h3 className="mb-3 font-semibold">Active investments</h3>
            <div className="space-y-3">
              {vaults.map((v) => {
                const elapsed = (Date.now() - new Date(v.startAt).getTime()) / (1000 * 60 * 60 * 24);
                const pct = Math.min(100, (elapsed / v.days) * 100);
                return (
                  <div key={v.id} className="glass rounded-2xl p-5">
                    <div className="flex justify-between"><span className="font-semibold">{v.plan} Vault</span><span className="text-sm text-muted-foreground">{fmt(v.principal)} · {v.apy}% APY</span></div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full gradient-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{Math.max(0, Math.ceil(v.days - elapsed))} days remaining</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {openVault && (
        <Modal onClose={() => setOpenVault(null)}>
          <div className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" /><h3 className="text-lg font-bold">Open {openVault.plan} Vault</h3></div>
          <p className="mt-1 text-sm text-muted-foreground">Amount to lock ($)</p>
          <input type="number" min="1" value={vaultAmt} onChange={(e) => setVaultAmt(e.target.value)} className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          <p className="mt-2 text-xs text-accent-foreground bg-accent/20 rounded p-2">Funds will be locked securely until the maturity date ({openVault.days} days).</p>
          <div className="mt-1 text-xs text-muted-foreground">Investment cash available: {fmt(user.balances.investment)}</div>
          <button onClick={confirmVault} className="mt-4 w-full rounded-lg gradient-primary py-3 font-medium text-primary-foreground">Confirm & Purchase Investment</button>
        </Modal>
      )}
      {openAdd && (
        <Modal onClose={() => setOpenAdd(false)}>
          <h3 className="text-lg font-bold">Add funds to investment</h3>
          <p className="mt-1 text-sm text-muted-foreground">Move money from your main balance ({fmt(user.balances.main)}).</p>
          <input type="number" min="1" value={addAmt} onChange={(e) => setAddAmt(e.target.value)} className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Amount" />
          <button onClick={confirmAdd} className="mt-4 w-full rounded-lg gradient-primary py-3 font-medium text-primary-foreground">Add funds</button>
        </Modal>
      )}
    </DashboardShell>
  );
}

function Stat({ label, value, tone, action }: { label: string; value: string; tone?: "up" | "down"; action?: React.ReactNode }) {
  const color = tone === "up" ? "text-emerald-500" : tone === "down" ? "text-destructive" : "";
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
      {action}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-elegant animate-fade-up" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}