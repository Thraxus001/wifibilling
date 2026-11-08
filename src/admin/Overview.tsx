import { api } from "../lib/api";
import { fmtBytes, fmtKES } from "../lib/format";
import { ErrorNote, Panel } from "../ui";
import { RevenueBars, TrafficChart } from "./charts";
import { usePoll } from "./usePoll";

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-ink/55 sm:text-sm">{label}</p>
        <span className="h-2 w-2 rounded-full bg-signal/70" aria-hidden />
      </div>
      <p className="mt-3 font-display text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">{value}</p>
      {sub && <p className="mt-1.5 text-xs text-ink/55">{sub}</p>}
    </div>
  );
}

export default function Overview() {
  const ov = usePoll(api.admin.overview, 10_000);
  const traffic = usePoll(() => api.admin.traffic(24), 30_000);
  const aps = usePoll(api.admin.accessPoints, 10_000);
  const o = ov.data;

  return (
    <div className="space-y-6">
      {ov.error && <ErrorNote>{ov.error}</ErrorNote>}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="Revenue today" value={o ? fmtKES(o.revenue_today) : "–"} sub={o ? `${o.pending_payments} payments waiting` : undefined} />
        <Stat label="Connected now" value={o ? String(o.active_sessions) : "–"} sub="paid sessions" />
        <Stat label="Access points online" value={o ? `${o.aps_online} of ${o.aps_total}` : "–"} />
        <Stat label="Traffic, 24 hours" value={o ? fmtBytes(o.traffic_24h) : "–"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="Traffic, last 24 hours">{traffic.data ? <TrafficChart points={traffic.data} /> : <p className="text-sm text-ink/60">Loading…</p>}</Panel>
        </div>
        <Panel title="Revenue, last 7 days">{o ? <RevenueBars days={o.revenue_7d} /> : <p className="text-sm text-ink/60">Loading…</p>}</Panel>
      </div>

      <Panel title="Access point load">
        <ul className="space-y-4">
          {aps.data?.map((ap) => {
            const pct = Math.min(100, (ap.clients / ap.max_clients) * 100);
            return (
              <li key={ap.id}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{ap.name} <span className="font-normal text-ink/60">{ap.location}</span></span>
                  <span className="tabular-nums text-ink/70">{ap.status === "online" ? `${ap.clients} of ${ap.max_clients} clients` : "Offline"}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper">
                  <div className={`h-full rounded-full transition-all ${pct > 85 ? "bg-bad" : pct > 60 ? "bg-sun" : "bg-signal"}`} style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
          {aps.data?.length === 0 && <p className="text-sm text-ink/60">No access points yet. Add one in the Access points tab.</p>}
        </ul>
      </Panel>
    </div>
  );
}
