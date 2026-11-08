import { useState } from "react";
import { api, errorMessage } from "../lib/api";
import { fmtBytes, fmtDateTime, fmtKES } from "../lib/format";
import { Badge, btnDanger, btnSmall, ErrorNote, Panel } from "../ui";
import { usePoll } from "./usePoll";

export function Sessions() {
  const [activeOnly, setActiveOnly] = useState(true);
  const { data, error, reload } = usePoll(() => api.admin.sessions(activeOnly), 10_000);
  const [note, setNote] = useState("");

  async function disconnect(id: number) {
    if (!confirm("Disconnect this device? Their remaining time is lost.")) return;
    try { await api.admin.disconnect(id); await reload(); } catch (e) { setNote(errorMessage(e)); }
  }

  return (
    <Panel
      title="Sessions"
      action={<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} /> Connected only</label>}
    >
      {(error || note) && <div className="mb-4"><ErrorNote>{error || note}</ErrorNote></div>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-ink/60"><tr><th className="pb-2 font-medium">Device</th><th className="pb-2 font-medium">Phone</th><th className="pb-2 font-medium">Package</th><th className="pb-2 font-medium">Access point</th><th className="pb-2 font-medium">Ends</th><th className="pb-2 font-medium">Data</th><th className="pb-2 font-medium">Status</th><th /></tr></thead>
          <tbody className="divide-y divide-line">
            {data?.map((s) => (
              <tr key={s.id}>
                <td className="py-3 font-mono text-xs">{s.device_mac}</td>
                <td className="py-3">{s.phone}</td>
                <td className="py-3">{s.package_name}</td>
                <td className="py-3">{s.ap_name ?? "–"}</td>
                <td className="py-3">{fmtDateTime(s.expires_at)}</td>
                <td className="py-3 tabular-nums">{fmtBytes(s.bytes_used)}{s.data_cap_bytes ? ` / ${fmtBytes(s.data_cap_bytes)}` : ""}</td>
                <td className="space-x-1.5 py-3"><Badge tone={s.status === "active" ? "ok" : "neutral"}>{s.status === "active" ? "Connected" : s.status === "expired" ? "Ended" : "Disconnected"}</Badge>{s.violations > 0 && <Badge tone="warn">{`Sharing blocked ×${s.violations}`}</Badge>}</td>
                <td className="py-3 text-right">{s.status === "active" && <button className={`${btnDanger} ${btnSmall}`} onClick={() => void disconnect(s.id)}>Disconnect</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.length === 0 && <p className="py-6 text-center text-sm text-ink/60">No sessions to show.</p>}
      </div>
    </Panel>
  );
}

export function Payments() {
  const { data, error } = usePoll(api.admin.payments, 10_000);
  const tone = { success: "ok", pending: "warn", failed: "bad" } as const;
  const label = { success: "Paid", pending: "Waiting", failed: "Failed" } as const;
  return (
    <Panel title="Payments">
      {error && <div className="mb-4"><ErrorNote>{error}</ErrorNote></div>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-ink/60"><tr><th className="pb-2 font-medium">When</th><th className="pb-2 font-medium">Phone</th><th className="pb-2 font-medium">Package</th><th className="pb-2 font-medium">Amount</th><th className="pb-2 font-medium">Reference</th><th className="pb-2 font-medium">Status</th></tr></thead>
          <tbody className="divide-y divide-line">
            {data?.map((p) => (
              <tr key={p.id}>
                <td className="py-3">{fmtDateTime(p.created_at)}</td>
                <td className="py-3">{p.phone}</td>
                <td className="py-3">{p.package_name}</td>
                <td className="py-3 tabular-nums">{fmtKES(p.amount)}</td>
                <td className="py-3 font-mono text-xs">{p.provider_ref ?? "–"}</td>
                <td className="py-3"><Badge tone={tone[p.status]}>{label[p.status]}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
