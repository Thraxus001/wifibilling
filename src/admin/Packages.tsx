import { useState } from "react";
import { api, errorMessage } from "../lib/api";
import { fmtBytes, fmtDuration, fmtKES } from "../lib/format";
import type { Package, PackageInput } from "../types";
import { Badge, btnGhost, btnPrimary, btnSmall, ErrorNote, Field, inputCls, Panel } from "../ui";
import { usePoll } from "./usePoll";

const blank: PackageInput = { name: "", description: "", price: 20, duration_minutes: 60, data_cap_mb: null, speed_mbps: 5, popular: false, active: true };

function PackageForm({ initial, onDone, onCancel }: { initial: Package | null; onDone: () => void; onCancel: () => void }) {
  const [f, setF] = useState<PackageInput>(initial ? { ...initial } : blank);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof PackageInput>(k: K, v: PackageInput[K]) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    setBusy(true); setError("");
    try {
      const { id: _id, ...body } = f as Package;
      initial ? await api.admin.updatePackage(initial.id, body) : await api.admin.createPackage(body);
      onDone();
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  }

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); void save(); }}>
      <Field label="Name"><input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} required /></Field>
      <Field label="Description"><input className={inputCls} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
      <Field label="Price (KES)"><input className={inputCls} type="number" min={1} value={f.price} onChange={(e) => set("price", Number(e.target.value))} required /></Field>
      <Field label="Time allowed (minutes)" hint={`Customers see: ${fmtDuration(f.duration_minutes || 1)}`}>
        <input className={inputCls} type="number" min={1} value={f.duration_minutes} onChange={(e) => set("duration_minutes", Number(e.target.value))} required />
      </Field>
      <Field label="Data cap (MB)" hint="Leave empty for unlimited data.">
        <input className={inputCls} type="number" min={1} value={f.data_cap_mb ?? ""} onChange={(e) => set("data_cap_mb", e.target.value ? Number(e.target.value) : null)} />
      </Field>
      <Field label="Speed limit (Mbps)"><input className={inputCls} type="number" min={1} value={f.speed_mbps} onChange={(e) => set("speed_mbps", Number(e.target.value))} required /></Field>
      <div className="flex gap-6 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.popular} onChange={(e) => set("popular", e.target.checked)} /> Mark as most chosen</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} /> Available to customers</label>
      </div>
      {error && <div className="sm:col-span-2"><ErrorNote>{error}</ErrorNote></div>}
      <div className="flex gap-2 sm:col-span-2">
        <button className={btnPrimary} disabled={busy}>{busy ? "Saving…" : "Save package"}</button>
        <button type="button" className={btnGhost} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function Packages() {
  const { data, error, reload } = usePoll(api.admin.packages, 30_000);
  const [editing, setEditing] = useState<Package | "new" | null>(null);

  return (
    <div className="space-y-6">
      {error && <ErrorNote>{error}</ErrorNote>}
      {editing && (
        <Panel title={editing === "new" ? "New package" : `Edit ${editing.name}`}>
          <PackageForm initial={editing === "new" ? null : editing} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); void reload(); }} />
        </Panel>
      )}
      <Panel title="Packages" action={<button className={`${btnPrimary} ${btnSmall}`} onClick={() => setEditing("new")}>Add package</button>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-ink/60"><tr><th className="pb-2 font-medium">Package</th><th className="pb-2 font-medium">Price</th><th className="pb-2 font-medium">Time</th><th className="pb-2 font-medium">Data</th><th className="pb-2 font-medium">Speed</th><th className="pb-2 font-medium">Status</th><th /></tr></thead>
            <tbody className="divide-y divide-line">
              {data?.map((p) => (
                <tr key={p.id}>
                  <td className="py-3 font-medium">{p.name} {p.popular && <Badge tone="warn">Most chosen</Badge>}</td>
                  <td className="py-3 tabular-nums">{fmtKES(p.price)}</td>
                  <td className="py-3">{fmtDuration(p.duration_minutes)}</td>
                  <td className="py-3">{p.data_cap_mb ? fmtBytes(p.data_cap_mb * 1048576) : "Unlimited"}</td>
                  <td className="py-3">{p.speed_mbps} Mbps</td>
                  <td className="py-3"><Badge tone={p.active ? "ok" : "neutral"}>{p.active ? "Available" : "Hidden"}</Badge></td>
                  <td className="py-3 text-right"><button className={`${btnGhost} ${btnSmall}`} onClick={() => setEditing(p)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
