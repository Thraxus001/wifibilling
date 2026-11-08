import { useCallback, useEffect, useMemo, useState } from "react";
import { api, errorMessage, getDeviceId, hotspot } from "../lib/api";
import { fmtBytes, fmtClock, fmtDuration, fmtKES } from "../lib/format";
import type { Package, PortalSession } from "../types";
import { btnGhost, btnPrimary, ErrorNote, Field, inputCls } from "../ui";

const NETWORK = import.meta.env.VITE_NETWORK_NAME ?? "Guest Wi-Fi";
type Step = "browse" | "waiting" | "failed";

const secondsLeft = (iso: string | null) => (iso ? Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000)) : 0);

function useRemaining(expiresAt: string | null) {
  const [left, setLeft] = useState(() => secondsLeft(expiresAt));
  useEffect(() => {
    setLeft(secondsLeft(expiresAt));
    const id = setInterval(() => setLeft(secondsLeft(expiresAt)), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return left;
}

function Connected({ session, onAddTime, onExpired }: { session: PortalSession; onAddTime: () => void; onExpired: () => void }) {
  const left = useRemaining(session.expires_at);
  const { days, clock } = fmtClock(left);
  useEffect(() => { if (left === 0) onExpired(); }, [left, onExpired]);

  const cap = session.data_cap_bytes;
  const usedPct = cap ? Math.min(100, (session.bytes_used / cap) * 100) : 0;

  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-ink via-[#14385f] to-[#2455D6] p-6 text-white shadow-[0_24px_60px_-25px_rgba(15,39,66,0.65)] sm:p-8">
      <p className="flex items-center gap-2 text-sm font-medium text-white/80">
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" aria-hidden /> You're online · {session.package_name}
      </p>
      <p className="mt-7 text-sm text-white/70">Time left</p>
      <p className="mt-1 font-display text-5xl font-bold tracking-tight tabular-nums sm:text-6xl" aria-live="off">
        {days > 0 && <span className="mr-2 text-3xl text-sun">{days}d</span>}
        {clock}
      </p>
      <dl className="mt-7 grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm sm:gap-6 sm:p-5">
        <div>
          <dt className="text-white/60">Data used</dt>
          <dd className="font-medium">{fmtBytes(session.bytes_used)}{cap ? ` of ${fmtBytes(cap)}` : ""}</dd>
          {cap && (
            <div className="mt-2 h-1.5 rounded-full bg-white/15">
              <div className="h-full rounded-full bg-sun" style={{ width: `${usedPct}%` }} />
            </div>
          )}
        </div>
        <div>
          <dt className="text-white/60">Speed</dt>
          <dd className="font-medium">Up to {session.speed_mbps} Mbps</dd>
        </div>
      </dl>
      {hotspot() && (
        <a href={hotspot()!.origUrl.startsWith("$(") || !hotspot()!.origUrl ? "http://neverssl.com" : hotspot()!.origUrl} className="mt-6 block w-full rounded-xl bg-sun px-4 py-3 text-center text-sm font-bold text-ink shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
          Start browsing
        </a>
      )}
      <button onClick={onAddTime} className="mt-3 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun">
        Add more time
      </button>
    </div>
  );
}

export default function Portal() {
  const mac = useMemo(getDeviceId, []);
  const [packages, setPackages] = useState<Package[]>([]);
  const [session, setSession] = useState<PortalSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<Package | null>(null);
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<Step>("browse");
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!mac) return;
    try { setSession(await api.portalSession(mac)); } catch { /* keep the last known state */ }
  }, [mac]);

  useEffect(() => {
    api.packages().then(setPackages).catch((e) => setError(errorMessage(e)));
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // After the payment prompt is sent, poll until M-Pesa confirms or rejects it.
  useEffect(() => {
    if (step !== "waiting" || paymentId === null) return;
    const started = Date.now();
    const id = setInterval(async () => {
      try {
        const p = await api.paymentStatus(paymentId);
        if (p.status === "success") {
          clearInterval(id);
          await refresh();
          setStep("browse"); setSelected(null); setAdding(false);
        } else if (p.status === "failed" || Date.now() - started > 90_000) {
          clearInterval(id);
          setStep("failed");
        }
      } catch { /* try again on the next tick */ }
    }, 2000);
    return () => clearInterval(id);
  }, [step, paymentId, refresh]);

  async function pay() {
    if (!selected) return;
    if (!mac) {
      setError("Reconnect through the Wi-Fi sign-in page so we can identify your device.");
      return;
    }
    setError(""); setBusy(true);
    try {
      const res = await api.checkout({ phone, package_id: selected.id, mac });
      setPaymentId(res.payment_id);
      setStep("waiting");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const showConnected = session?.active && !adding && step === "browse";

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 flex items-center gap-3 sm:mb-10">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-signal to-[#6E8FFF] text-white shadow-lg shadow-signal/20" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 9.5a10 10 0 0 1 14 0M8 12.5a6 6 0 0 1 8 0m-5 3a2 2 0 0 1 2 0M12 19h.01" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-signal">Connected, your way</p>
          <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{NETWORK}</h1>
        </div>
      </header>

      <section className="surface p-5 sm:p-8">
        {!showConnected && !loading && step === "browse" && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-signal">Fast, secure Wi-Fi</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Choose your pass</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink/65">
              {adding ? "Extra time is added to what you have left." : "Pick the plan that suits you. Your connection starts as soon as M-Pesa confirms your payment."}
              {adding && <button className="ml-1 font-semibold text-signal underline underline-offset-4" onClick={() => setAdding(false)}>Back to my connection</button>}
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-3 py-8 text-sm text-ink/60">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-signal" aria-hidden />
            Checking your connection…
          </div>
        ) : showConnected && session ? (
          <Connected session={session} onAddTime={() => setAdding(true)} onExpired={refresh} />
        ) : step === "waiting" ? (
          <div className="rounded-2xl bg-paper/80 p-8 text-center sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-signal/10 text-signal">
              <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-signal/20 border-t-signal" aria-hidden />
            </div>
            <h2 className="mt-5 text-xl font-bold">Check your phone</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/65">
              Enter your M-Pesa PIN to pay {selected && fmtKES(selected.price)}. This page updates by itself once the payment goes through.
            </p>
            <p className="mt-5 text-xs font-medium text-ink/45">Please keep this page open while we confirm your payment.</p>
          </div>
        ) : step === "failed" ? (
          <div className="mx-auto max-w-md rounded-2xl bg-paper/80 p-6 text-center sm:p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-bad/10 text-xl font-bold text-bad" aria-hidden>!</div>
            <h2 className="mt-4 text-xl font-bold">Payment didn&apos;t go through</h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">You haven&apos;t been charged for this attempt. Check that your M-Pesa balance covers {selected && fmtKES(selected.price)}, then try again.</p>
            <button className={`${btnPrimary} mt-6 w-full`} onClick={() => setStep("browse")}>Try again</button>
          </div>
        ) : (
          <div className="space-y-6">
            {!mac && (
              <p role="alert" className="rounded-xl border border-sun/40 bg-sun/10 px-4 py-3 text-sm leading-5 text-[#76500c]">
                We can’t identify this device. Connect to the Wi-Fi network and reopen its sign-in page to purchase access.
              </p>
            )}
            <ul className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Packages">
              {packages.map((p) => {
                const active = selected?.id === p.id;
                return (
                  <li key={p.id}>
                    <button
                      role="radio" aria-checked={active} onClick={() => setSelected(p)}
                      className={`group relative flex h-full w-full flex-col rounded-2xl border p-4 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-signal/15 sm:p-5 ${active ? "border-signal bg-signal/[0.035] shadow-[0_10px_30px_-18px_rgba(47,107,255,0.7)] ring-1 ring-signal" : "border-line/80 bg-white hover:-translate-y-0.5 hover:border-signal/40 hover:shadow-lg hover:shadow-ink/5"}`}
                    >
                      <div className="flex w-full items-start justify-between gap-3">
                        <span className="font-display text-xl font-bold tracking-tight">{fmtDuration(p.duration_minutes)}</span>
                        <span className="text-right text-lg font-bold tabular-nums">{fmtKES(p.price)}</span>
                      </div>
                      <p className="mt-2 min-h-10 text-sm leading-5 text-ink/65">{p.description || p.name}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line/70 pt-3 text-xs font-medium text-ink/60">
                        <span className="rounded-full bg-paper px-2.5 py-1">{p.data_cap_mb ? `${fmtBytes(p.data_cap_mb * 1048576)} data` : "Unlimited data"}</span>
                        <span className="rounded-full bg-paper px-2.5 py-1">{p.speed_mbps} Mbps</span>
                        {p.popular && <span className="rounded-full bg-sun/20 px-2.5 py-1 font-semibold text-[#8A5A00]">Most popular</span>}
                      </div>
                      <div className="mt-4 flex items-center justify-between text-xs font-semibold">
                        <span className={active ? "text-signal" : "text-ink/50"}>{active ? "Selected" : "Select this pass"}</span>
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${active ? "border-signal bg-signal text-white" : "border-line text-transparent group-hover:border-signal/40"}`} aria-hidden>✓</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            {selected && (
              <form className="rounded-2xl border border-line/70 bg-paper/55 p-4 sm:p-5" onSubmit={(e) => { e.preventDefault(); void pay(); }}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-ink/50">Your selected pass</p>
                    <p className="mt-1 font-semibold">{fmtDuration(selected.duration_minutes)} Wi-Fi</p>
                  </div>
                  <p className="text-xl font-bold tabular-nums">{fmtKES(selected.price)}</p>
                </div>
                <Field label="M-Pesa phone number" hint="We’ll send a secure payment prompt to this number.">
                  <input className={inputCls} type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </Field>
                {error && <div className="mt-3"><ErrorNote>{error}</ErrorNote></div>}
                <button className={`${btnPrimary} mt-4 w-full py-3`} disabled={busy || phone.trim().length < 9 || !mac}>
                  {busy ? "Sending prompt…" : !mac ? "Connect to Wi-Fi to continue" : `Pay ${fmtKES(selected.price)} with M-Pesa`}
                </button>
                <p className="mt-3 text-center text-xs text-ink/50">Secure payment via M-Pesa · No password needed</p>
              </form>
            )}
            {!selected && error && <ErrorNote>{error}</ErrorNote>}
            {adding && <button className={`${btnGhost} w-full`} onClick={() => setAdding(false)}>Cancel</button>}
          </div>
        )}
      </section>
      <footer className="py-6 text-center text-xs text-ink/45">
        Simple, reliable internet when you need it.
      </footer>
    </main>
  );
}
