"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  addTicketMessage,
  createTicket,
  getTicket,
  listMyTickets,
  type Ticket,
} from "@/services/tickets";
import { useAuthStore } from "@/store/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";

function SupportInner() {
  const search = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const preTopic = search.get("topic") || "";
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [name, setName] = useState(user?.profile?.full_name || "");
  const [telegram, setTelegram] = useState(user?.profile?.telegram_username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [topic, setTopic] = useState(preTopic || "General support");
  const [description, setDescription] = useState("");

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await listMyTickets();
      if (res.success && res.data) setTickets(res.data);
    } catch {
      setError("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (preTopic) setTopic(preTopic);
  }, [preTopic]);

  useEffect(() => {
    if (user?.profile?.full_name) setName(user.profile.full_name);
    if (user?.profile?.telegram_username) setTelegram(user.profile.telegram_username);
    if (user?.email) setEmail(user.email);
  }, [user]);

  const openTicket = async (id: string) => {
    const res = await getTicket(id);
    if (res.success && res.data) setSelected(res.data);
  };

  const sorted = useMemo(
    () => [...tickets].sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at)),
    [tickets],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Help desk"
        title="Support"
        description="Create a ticket or continue a conversation with the team."
      />

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-panel p-5">
          <h2 className="font-display text-lg font-semibold">New ticket</h2>
          <div className="mt-4 space-y-3">
            <input className="field-input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="field-input" placeholder="Telegram" value={telegram} onChange={(e) => setTelegram(e.target.value)} />
            <input className="field-input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="field-input" placeholder="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
            <textarea
              className="field-input min-h-[120px]"
              placeholder="Describe the issue"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button
              type="button"
              className="btn-primary"
              onClick={() =>
                void (async () => {
                  const res = await createTicket({
                    name,
                    telegram_username: telegram,
                    email,
                    topic,
                    description,
                  });
                  if (!res.success) {
                    setError(res.message || "Failed to create ticket");
                    return;
                  }
                  setDescription("");
                  await load();
                  if (res.data) setSelected(res.data);
                })()
              }
            >
              Submit ticket
            </button>
          </div>
        </section>

        <section className="surface-panel p-5">
          <h2 className="font-display text-lg font-semibold">My tickets</h2>
          {loading ? <Skeleton className="mt-4 h-32" /> : null}
          {!loading && sorted.length === 0 ? (
            <EmptyState
              className="mt-4 border-0 bg-transparent p-0"
              title="No tickets yet"
              description="Submit a ticket or escalate from the AI assistant when you need a human."
            />
          ) : null}
          <ul className="mt-4 space-y-2">
            {sorted.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => void openTicket(t.id)}
                  className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2.5 text-left text-sm hover:border-accent/40"
                >
                  <span>
                    <span className="font-medium">{t.topic}</span>
                    <span className="mt-0.5 block text-xs text-muted">{new Date(t.updated_at).toLocaleString()}</span>
                  </span>
                  <StatusBadge label={t.status} tone={statusTone(t.status)} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {selected ? (
        <section className="surface-panel p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">{selected.topic}</h2>
              <div className="mt-2">
                <StatusBadge label={selected.status} tone={statusTone(selected.status)} />
              </div>
            </div>
            <button type="button" className="text-sm text-muted" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
          <div className="mt-4 max-h-80 space-y-3 overflow-y-auto">
            {(selected.messages || []).map((m) => (
              <div key={m.id} className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted">{m.sender_type}</p>
                <p className="mt-1 leading-relaxed">{m.message}</p>
              </div>
            ))}
          </div>
          {selected.status !== "closed" ? (
            <div className="mt-4 flex gap-2">
              <input className="field-input" placeholder="Reply…" value={reply} onChange={(e) => setReply(e.target.value)} />
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
                Send
              </button>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <SupportInner />
    </Suspense>
  );
}
