"use client";

import { Suspense, useEffect, useState } from "react";
import {
  addTicketMessage,
  adminListTickets,
  adminPatchTicketStatus,
  getTicket,
  type Ticket,
} from "@/services/tickets";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";

function AdminTicketsInner() {
  const [items, setItems] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [status, setStatus] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const res = await adminListTickets({ status: status || undefined });
      if (res.success && res.data) setItems(res.data);
      else setError(res.message || "Failed to load");
    } catch {
      setError("Failed to load tickets");
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const openTicket = async (id: string) => {
    const res = await getTicket(id);
    if (res.success && res.data) setSelected(res.data);
  };

  return (
    <div className="space-y-6">
      <PageHeader kicker="Admin" title="Tickets" description="Human support queue and replies." />

      <select className="field-input max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">All status</option>
        <option value="open">Open</option>
        <option value="in_progress">In progress</option>
        <option value="solved">Solved</option>
        <option value="closed">Closed</option>
      </select>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-[1.25rem] border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] text-muted">
              <tr>
                <th className="px-4 py-3">Topic</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr
                  key={t.id}
                  className="cursor-pointer border-b border-[var(--border)] hover:bg-accent-soft"
                  onClick={() => void openTicket(t.id)}
                >
                  <td className="px-4 py-3">{t.topic}</td>
                  <td className="px-4 py-3">{t.name}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={t.status} tone={statusTone(t.status)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="surface-panel p-5">
          {selected ? (
            <>
              <h2 className="font-display text-lg font-semibold">{selected.topic}</h2>
              <p className="mt-1 text-sm text-muted">
                {selected.name} · @{selected.telegram_username || "—"} · {selected.email || "—"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["in_progress", "solved", "closed"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs capitalize hover:border-accent/40"
                    onClick={() =>
                      void (async () => {
                        await adminPatchTicketStatus(selected.id, s);
                        await openTicket(selected.id);
                        await load();
                      })()
                    }
                  >
                    Mark {s.replace("_", " ")}
                  </button>
                ))}
              </div>
              <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
                {(selected.messages || []).map((m) => (
                  <div key={m.id} className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm">
                    <p className="text-xs uppercase text-muted">{m.sender_type}</p>
                    <p className="mt-1">{m.message}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <input className="field-input" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Admin reply…" />
                <button
                  type="button"
                  className="btn-primary shrink-0"
                  onClick={() =>
                    void (async () => {
                      await addTicketMessage(selected.id, reply);
                      setReply("");
                      await openTicket(selected.id);
                      await load();
                    })()
                  }
                >
                  Reply
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">Select a ticket to reply.</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default function AdminTicketsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <AdminTicketsInner />
    </Suspense>
  );
}
