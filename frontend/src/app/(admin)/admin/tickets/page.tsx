"use client";

import { Suspense, useEffect, useState } from "react";
import {
  addTicketMessage,
  adminListTickets,
  adminPatchTicketStatus,
  getTicket,
  type Ticket,
} from "@/services/tickets";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import {
  AdminBleed,
  AdminEmpty,
  AdminFilterSeg,
  AdminListRow,
  AdminPageHeader,
  AdminSplit,
  formatRelativeTime,
} from "@/components/admin/AdminChrome";

const FILTERS = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "solved", label: "Solved" },
  { value: "closed", label: "Closed" },
];

function AdminTicketsInner() {
  const [items, setItems] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [status, setStatus] = useState("open");
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await adminListTickets({ status: status || undefined });
      if (res.success && res.data) setItems(res.data);
      else setError(res.message || "Failed to load");
    } catch {
      setError("Failed to load tickets");
    } finally {
      setLoading(false);
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
    <AdminBleed>
      <AdminPageHeader
        title="Tickets"
        description="Human support queue"
        actions={
          <AdminFilterSeg
            value={status}
            options={FILTERS}
            onChange={(v) => {
              setStatus(v);
              setSelected(null);
            }}
          />
        }
      />
      {error ? (
        <p className="border-b border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-2 text-sm text-[var(--danger)] md:px-6">
          {error}
        </p>
      ) : null}
      <AdminSplit
        list={
          <>
            <div className="hidden grid-cols-[1.5fr_1fr_auto] gap-3 border-b border-[var(--border)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted md:grid md:px-6">
              <span>Topic</span>
              <span>Member</span>
              <span className="text-right">Status</span>
            </div>
            {loading ? (
              <div className="space-y-2 p-4 md:p-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-[var(--surface-2)]" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <AdminEmpty title="No tickets" description="Inbox is empty for this filter." />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {items.map((t) => (
                  <li key={t.id}>
                    <AdminListRow
                      active={selected?.id === t.id}
                      onClick={() => void openTicket(t.id)}
                      className="md:grid-cols-[1.5fr_1fr_auto]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{t.topic}</p>
                        <p className="mt-0.5 text-[11px] text-muted">{formatRelativeTime(t.updated_at || t.created_at)}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm">{t.name}</p>
                        <p className="truncate text-xs text-muted">{t.email || "—"}</p>
                      </div>
                      <div className="md:justify-self-end">
                        <StatusBadge label={t.status} tone={statusTone(t.status)} />
                      </div>
                    </AdminListRow>
                  </li>
                ))}
              </ul>
            )}
          </>
        }
        detail={
          !selected ? (
            <AdminEmpty title="Select a ticket" description="Open a conversation to reply." />
          ) : (
            <>
              <div className="border-b border-[var(--border)] px-5 py-4 md:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-lg font-semibold">{selected.topic}</p>
                    <p className="mt-1 text-sm text-muted">
                      {selected.name}
                      {selected.email ? ` · ${selected.email}` : ""}
                      {selected.telegram_username ? ` · @${selected.telegram_username}` : ""}
                    </p>
                  </div>
                  <StatusBadge label={selected.status} tone={statusTone(selected.status)} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {["in_progress", "solved", "closed"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="rounded-md border border-[var(--border)] px-2.5 py-1 text-[11px] font-medium capitalize text-muted transition hover:border-accent/40 hover:text-accent"
                      onClick={() =>
                        void (async () => {
                          await adminPatchTicketStatus(selected.id, s);
                          await openTicket(selected.id);
                          await load();
                        })()
                      }
                    >
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4 md:px-6">
                <p className="rounded-xl bg-[var(--surface-2)] px-3 py-2 text-sm text-muted">{selected.description}</p>
                {(selected.messages || []).map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm ${
                      m.sender_type === "admin" ? "border-accent/20 bg-accent-soft/40" : ""
                    }`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{m.sender_type}</p>
                    <p className="mt-1 whitespace-pre-wrap">{m.message}</p>
                  </div>
                ))}
              </div>
              <div className="sticky bottom-0 flex gap-2 border-t border-[var(--border)] bg-[var(--card)] px-5 py-4 md:px-6">
                <input
                  className="field-input"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Admin reply…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void (async () => {
                        if (!reply.trim() || busy) return;
                        setBusy(true);
                        try {
                          await addTicketMessage(selected.id, reply.trim());
                          setReply("");
                          await openTicket(selected.id);
                          await load();
                        } finally {
                          setBusy(false);
                        }
                      })();
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={busy || !reply.trim()}
                  className="btn-primary shrink-0"
                  onClick={() =>
                    void (async () => {
                      if (!reply.trim()) return;
                      setBusy(true);
                      try {
                        await addTicketMessage(selected.id, reply.trim());
                        setReply("");
                        await openTicket(selected.id);
                        await load();
                      } finally {
                        setBusy(false);
                      }
                    })()
                  }
                >
                  Reply
                </button>
              </div>
            </>
          )
        }
      />
    </AdminBleed>
  );
}

export default function AdminTicketsPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted">Loading…</p>}>
      <AdminTicketsInner />
    </Suspense>
  );
}
