import { useEffect, useRef, useState } from "react";
import { ShieldAlert, ShieldCheck, MessageCircle, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { verifyPaymentPin } from "@/lib/pin.functions";

const WHATSAPP =
  "https://wa.me/2347045510914?text=My%20CrestVest%20account%20has%20been%20locked.%20Please%20help.";

export function PinPromptModal({
  open,
  length = 4,
  title = "Enter your Payment PIN",
  subtitle = "Confirm this transaction with your PIN.",
  onSuccess,
  onClose,
}: {
  open: boolean;
  length?: 4 | 6;
  title?: string;
  subtitle?: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const verify = useServerFn(verifyPaymentPin);
  const [pin, setPin] = useState("");
  const [warn, setWarn] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPin("");
      setWarn(null);
      setLocked(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const submit = async (val: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await verify({ data: { pin: val } });
      if (res.ok) {
        onSuccess();
      } else if (res.locked) {
        setLocked(true);
        setWarn(null);
      } else if (res.reason === "no_pin") {
        setWarn("No PIN is set on your account. Set one in Settings.");
      } else {
        setWarn(`Incorrect PIN. ${res.remaining} attempts remaining.`);
        setPin("");
      }
    } catch (e) {
      setWarn((e as Error).message || "PIN verification failed.");
    } finally {
      setBusy(false);
    }
  };

  const cells = Array.from({ length });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-8 shadow-elegant animate-fade-up">
        <button aria-label="Close" onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1 hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
        {locked ? (
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/15">
              <ShieldAlert className="h-12 w-12 text-destructive" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-destructive">Transactions Locked</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You entered the wrong PIN 4 times. For your security we've locked payments on your account.
              Please contact customer service via WhatsApp to unlock.
            </p>
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 font-medium text-white shadow-elegant hover:brightness-110"
            >
              <MessageCircle className="h-4 w-4" /> Contact Customer Service
            </a>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
              <ShieldCheck className="h-9 w-9 text-primary" />
            </div>
            <h2 className="mt-4 text-xl font-bold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-6 flex justify-center gap-2">
              {cells.map((_, i) => (
                <div
                  key={i}
                  className={`flex h-12 w-10 items-center justify-center rounded-lg border text-xl font-bold ${
                    pin.length > i ? "border-primary bg-primary/10" : "border-input bg-background"
                  }`}
                >
                  {pin[i] ? "•" : ""}
                </div>
              ))}
            </div>
            <input
              ref={inputRef}
              type="tel"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={pin}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, length);
                setPin(v);
                setWarn(null);
                if (v.length === length) void submit(v);
              }}
              className="sr-only"
              aria-label="Payment PIN"
            />
            <button
              onClick={() => inputRef.current?.focus()}
              className="mt-3 text-xs text-primary underline-offset-4 hover:underline"
            >
              Tap to enter PIN
            </button>
            {warn && (
              <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {warn}
              </p>
            )}
            {busy && <p className="mt-3 text-xs text-muted-foreground">Verifying…</p>}
          </div>
        )}
      </div>
    </div>
  );
}