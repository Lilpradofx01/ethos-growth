import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { useApp } from "@/context/app-context";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/loans")({ component: Loans });

function Loans() {
  const { user, requestLoan } = useApp();
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  if (!user) return null;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 10_000));
      await requestLoan(Number(amount), email);
      alert("Message Sent Successfully. Our team will review your application.");
      setAmount(""); setPurpose(""); setEmail("");
    } catch (err) { toast.error((err as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <DashboardShell title="Loans">
      <div className="mx-auto max-w-md">
        <form onSubmit={submit} className="glass rounded-2xl p-5 space-y-3">
          <h2 className="text-xl font-bold">Apply for a loan</h2>
          <p className="text-sm text-muted-foreground">Standard US-bank underwriting. Approval decisions arrive within 1–3 business days.</p>
          <input required type="number" min="100" placeholder="Amount ($)" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          <input required placeholder="Purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          <input required type="email" placeholder="Your account email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          <button disabled={busy} className="w-full rounded-xl gradient-primary py-3 font-medium text-primary-foreground disabled:opacity-60 flex items-center justify-center gap-2">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} {busy ? "Submitting…" : "Submit application"}
          </button>
        </form>
      </div>
    </DashboardShell>
  );
}