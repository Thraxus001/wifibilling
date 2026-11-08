import { fmtBytes, fmtTime } from "../lib/format";
import type { TrafficPoint } from "../types";

const W = 640, H = 200, PAD = { l: 8, r: 8, t: 10, b: 24 };

export function TrafficChart({ points }: { points: TrafficPoint[] }) {
  if (points.length < 2) return <p className="py-10 text-center text-sm text-ink/60">No traffic recorded yet.</p>;
  const max = Math.max(...points.map((p) => p.rx + p.tx), 1);
  const x = (i: number) => PAD.l + (i / (points.length - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b);
  const area = (top: (p: TrafficPoint) => number, bottom: (p: TrafficPoint) => number) =>
    points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(top(p))}`).join(" ") +
    points.slice().reverse().map((p, i) => `L${x(points.length - 1 - i)},${y(bottom(p))}`).join(" ") + "Z";
  const ticks = [0, Math.floor(points.length / 2), points.length - 1];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Traffic over the last 24 hours">
        <path d={area((p) => p.rx, () => 0)} fill="#2F6BFF" fillOpacity="0.85" />
        <path d={area((p) => p.rx + p.tx, (p) => p.rx)} fill="#FFB020" />
        <line x1={PAD.l} x2={W - PAD.r} y1={y(0)} y2={y(0)} stroke="#D9E0EA" />
        {ticks.map((i) => (
          <text key={i} x={x(i)} y={H - 6} fontSize="11" fill="#0F2742" opacity="0.6" textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}>
            {fmtTime(points[i].t)}
          </text>
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink/70">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-signal" /> Downloads</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-sun" /> Uploads</span>
        <span className="ml-auto">Busiest slot: {fmtBytes(max)} per interval</span>
      </div>
    </div>
  );
}

export function RevenueBars({ days }: { days: { date: string; amount: number }[] }) {
  const max = Math.max(...days.map((d) => d.amount), 1);
  return (
    <div className="flex h-40 items-end gap-2">
      {days.map((d) => (
        <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-xs tabular-nums text-ink/70">{d.amount.toLocaleString("en-KE")}</span>
          <div className="w-full rounded-t bg-signal" style={{ height: `${Math.max(2, (d.amount / max) * 100)}%`, maxHeight: "calc(100% - 3rem)" }} />
          <span className="text-xs text-ink/60">{new Date(d.date + "T00:00:00").toLocaleDateString("en-KE", { weekday: "short" })}</span>
        </div>
      ))}
    </div>
  );
}
