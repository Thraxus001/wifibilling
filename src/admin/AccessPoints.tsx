import { useState } from "react";
import { api, errorMessage } from "../lib/api";
import { fmtBytes, timeAgo } from "../lib/format";
import type { AccessPoint } from "../types";
import { Badge, btnDanger, btnGhost, btnPrimary, btnSmall, ErrorNote, Field, inputCls, Panel } from "../ui";
import { usePoll } from "./usePoll";

const blank = { name: "", location: "", mac: "", ip: "", interface: "", max_clients: 50 };

export default function AccessPoints() {
  const { data, error, reload } = usePoll(api.admin.accessPoints, 10_000);
  const [form, setForm] = useState<typeof blank | null>(null);
  const [formError, setFormError] = useState("");
  const [note, setNote] = useState("");

  async function run(action: () => Promise<unknown>) {
    setNote("");
    try { await action(); await reload(); } catch (e) { setNote(errorMessage(e)); }
  }

  async function add() {
    if (!form) return;
    setFormError("");
    try { await api.admin.createAccessPoint(form); setForm(null); await reload(); }
    catch (e) { setFormError(errorMessage(e)); }
  }

  const toggle = (ap: AccessPoint) => run(() => api.admin.setApStatus(ap.id, ap.status === "online" ? "offline" : "online"));
  const remove = (ap: AccessPoint) => {
    if (confirm(`Remove ${ap.name}? Its traffic history is deleted too.`)) void run(() => api.admin.deleteAp(ap.id));
  };

  return (
    <div className="space-y-6">
      {(error || note) && <ErrorNote>{error || note}</ErrorNote>}
      {form && (
        <Panel title="Add access point">
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); void add(); }}>
            <Field label="Name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
            <Field label="Location"><input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
            <Field label="MAC address" hint="Format aa:bb:cc:dd:ee:ff"><input className={inputCls} value={form.mac} onChange={(e) => setForm({ ...form, mac: e.target.value })} required /></Field>
            <Field label="IP address"><input className={inputCls} value={form.ip} onChange={(e) => setForm({ ...form, ip: e.target.value })} /></Field>
            <Field label="Router interface" hint="The interface name on the MikroTik, like wlan1. Needed for live traffic and client counts."><input className={inputCls} value={form.interface} onChange={(e) => setForm({ ...form, interface: e.target.value })} /></Field>
            <Field label="Client limit"><input className={inputCls} type="number" min={1} value={form.max_clients} onChange={(e) => setForm({ ...form, max_clients: Number(e.target.value) })} /></Field>
            {formError && <div className="sm:col-span-2"><ErrorNote>{formError}</ErrorNote></div>}
            <div className="flex gap-2 sm:col-span-2">
              <button className={btnPrimary}>Add access point</button>
              <button type="button" className={btnGhost} onClick={() => setForm(null)}>Cancel</button>
            </div>
          </form>
        </Panel>
      )}
      <Panel title="Access points" action={<button className={`${btnPrimary} ${btnSmall}`} onClick={() => setForm(blank)}>Add access point</button>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-ink/60"><tr><th className="pb-2 font-medium">Name</th><th className="pb-2 font-medium">Address</th><th className="pb-2 font-medium">Status</th><th className="pb-2 font-medium">Clients</th><th className="pb-2 font-medium">Traffic, 24 h</th><th className="pb-2 font-medium">Last seen</th><th /></tr></thead>
            <tbody className="divide-y divide-line">
              {data?.map((ap) => (
                <tr key={ap.id}>
                  <td className="py-3"><p className="font-medium">{ap.name}</p><p className="text-xs text-ink/60">{ap.location}</p></td>
                  <td className="py-3"><p className="font-mono text-xs">{ap.mac}</p><p className="text-xs text-ink/60">{ap.ip}{ap.interface && ` · ${ap.interface}`}</p></td>
                  <td className="py-3"><Badge tone={ap.status === "online" ? "ok" : "bad"}>{ap.status === "online" ? "Online" : "Offline"}</Badge></td>
                  <td className="py-3 tabular-nums">{ap.clients} / {ap.max_clients}</td>
                  <td className="py-3 tabular-nums">{fmtBytes(ap.traffic_24h)}</td>
                  <td className="py-3">{timeAgo(ap.last_seen)}</td>
                  <td className="space-x-2 whitespace-nowrap py-3 text-right">
                    <button className={`${btnGhost} ${btnSmall}`} onClick={() => void toggle(ap)}>{ap.status === "online" ? "Take offline" : "Bring online"}</button>
                    <button className={`${btnGhost} ${btnSmall}`} onClick={() => void run(() => api.admin.rebootAp(ap.id))}>Reboot</button>
                    <button className={`${btnDanger} ${btnSmall}`} onClick={() => remove(ap)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
