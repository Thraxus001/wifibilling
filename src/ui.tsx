import type { ReactNode } from "react";

const base =
  "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
export const btnPrimary = `${base} bg-signal text-white shadow-[0_8px_18px_-8px_rgba(47,107,255,0.8)] hover:-translate-y-0.5 hover:bg-signal-dark`;
export const btnGhost = `${base} border border-line bg-white text-ink hover:border-signal/40 hover:bg-paper`;
export const btnDanger = `${base} border border-bad/30 bg-white text-bad hover:bg-bad/5`;
export const btnSmall = "!px-3 !py-1.5 !text-xs";
export const inputCls =
  "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink placeholder:text-ink/40 transition focus:border-signal focus:outline-none focus:ring-4 focus:ring-signal/10";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink/60">{hint}</span>}
    </label>
  );
}

const tones = {
  ok: "bg-ok/10 text-ok",
  bad: "bg-bad/10 text-bad",
  warn: "bg-sun/20 text-[#8A5A00]",
  neutral: "bg-ink/5 text-ink/70",
};
export function Badge({ tone = "neutral", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return <p role="alert" className="rounded-lg border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">{children}</p>;
}

export function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="surface overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-line/70 px-5 py-4 sm:px-6">
        <h2 className="text-base font-bold tracking-tight">{title}</h2>
        {action}
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}
