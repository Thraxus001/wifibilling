import { useEffect, useState } from "react";
import { api, clearToken, errorMessage, getToken, setUnauthorizedHandler } from "../lib/api";
import { btnPrimary, ErrorNote, Field, inputCls } from "../ui";
import AccessPoints from "./AccessPoints";
import { Payments, Sessions } from "./Customers";
import Overview from "./Overview";
import Packages from "./Packages";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "access-points", label: "Access points" },
  { id: "sessions", label: "Sessions" },
  { id: "payments", label: "Payments" },
  { id: "packages", label: "Packages" },
] as const;
type Tab = (typeof TABS)[number]["id"];

function Login({ onDone }: { onDone: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true); setError("");
    try { await api.admin.login(username, password); onDone(); }
    catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-signal to-[#6E8FFF] text-white shadow-lg shadow-signal/20" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 9.5a10 10 0 0 1 14 0M8 12.5a6 6 0 0 1 8 0m-5 3a2 2 0 0 1 2 0M12 19h.01" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-signal">Staff access</p>
          <h1 className="text-2xl font-bold tracking-tight">Wi-Fi admin</h1>
        </div>
      </div>
      <p className="text-sm leading-6 text-ink/65">Sign in to manage your network, access points and customer connections.</p>
      <form className="surface mt-6 space-y-4 p-5 sm:p-6" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        <Field label="Username"><input className={inputCls} autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required /></Field>
        <Field label="Password"><input className={inputCls} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
        {error && <ErrorNote>{error}</ErrorNote>}
        <button className={`${btnPrimary} w-full`} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </main>
  );
}

export default function AdminApp() {
  const [authed, setAuthed] = useState(() => !!getToken());
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => { setUnauthorizedHandler(() => setAuthed(false)); }, []);

  if (!authed) return <Login onDone={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-white/10 bg-gradient-to-b from-ink to-[#10233b] text-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0">
        <div className="flex items-center justify-between px-5 py-4 lg:block lg:px-6 lg:py-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sun ring-1 ring-white/10" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 9.5a10 10 0 0 1 14 0M8 12.5a6 6 0 0 1 8 0m-5 3a2 2 0 0 1 2 0M12 19h.01" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold">Wi-Fi admin</h1>
              <p className="text-xs text-white/50">Network console</p>
            </div>
          </div>
          <button className="rounded-lg px-2 py-1 text-xs font-medium text-white/60 transition hover:bg-white/10 hover:text-white lg:ml-12 lg:mt-4" onClick={() => { clearToken(); setAuthed(false); }}>Sign out</button>
        </div>
        <nav aria-label="Sections" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-4 lg:pb-0">
          {TABS.map((t) => (
            <button
              key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id ? "page" : undefined}
              className={`whitespace-nowrap rounded-xl px-3.5 py-3 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun ${tab === t.id ? "bg-white/12 text-white shadow-inner shadow-white/5 ring-1 ring-white/10" : "text-white/60 hover:bg-white/[0.06] hover:text-white/90"}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-signal">Network console</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{TABS.find((t) => t.id === tab)?.label}</h2>
          </div>
          <span className="hidden items-center gap-2 rounded-full border border-ok/15 bg-white/75 px-3 py-2 text-xs font-semibold text-ink/65 shadow-sm sm:inline-flex">
            <span className="h-2 w-2 rounded-full bg-ok" aria-hidden /> System overview
          </span>
        </div>
        {tab === "overview" && <Overview />}
        {tab === "access-points" && <AccessPoints />}
        {tab === "sessions" && <Sessions />}
        {tab === "payments" && <Payments />}
        {tab === "packages" && <Packages />}
      </main>
    </div>
  );
}
