"use client";

import { useEffect, useState } from "react";
import { LockedModule } from "@/components/member/LockedModule";
import { createJournal, deleteJournal, listJournals, type JournalItem } from "@/services/journal";
import { useAuthStore } from "@/store/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";

function isUnlocked(status?: string, role?: string) {
  return status === "verified" || role === "admin" || role === "super_admin";
}

function numOrNull(v: string) {
  if (!v.trim()) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function JournalPage() {
  const user = useAuthStore((s) => s.user);
  const unlocked = isUnlocked(user?.status, user?.role);
  const [items, setItems] = useState<JournalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pair, setPair] = useState("XAUUSD");
  const [direction, setDirection] = useState("buy");
  const [tradedAt, setTradedAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [entry, setEntry] = useState("");
  const [exit, setExit] = useState("");
  const [result, setResult] = useState("");
  const [notes, setNotes] = useState("");
  const [emotion, setEmotion] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listJournals();
      if (res.success && res.data) setItems(res.data);
      else setError(res.message || "Failed to load journal");
    } catch {
      setError("Failed to load journal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!unlocked) {
      setLoading(false);
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  if (!unlocked) return <LockedModule title="Trading Journal" />;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Private log"
        title="Trading Journal"
        description="Track setups, emotions, and outcomes — only you see these entries."
      />

      <section className="surface-panel p-5">
        <h2 className="font-display text-lg font-semibold">New entry</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className="field-input" type="datetime-local" value={tradedAt} onChange={(e) => setTradedAt(e.target.value)} />
          <input className="field-input" placeholder="Pair" value={pair} onChange={(e) => setPair(e.target.value)} />
          <select className="field-input" value={direction} onChange={(e) => setDirection(e.target.value)}>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
          <select className="field-input" value={result} onChange={(e) => setResult(e.target.value)}>
            <option value="">Result (optional)</option>
            <option value="win">Win</option>
            <option value="loss">Loss</option>
            <option value="be">BE</option>
          </select>
          <input className="field-input" placeholder="Entry" value={entry} onChange={(e) => setEntry(e.target.value)} />
          <input className="field-input" placeholder="Exit" value={exit} onChange={(e) => setExit(e.target.value)} />
          <input className="field-input" placeholder="Emotion" value={emotion} onChange={(e) => setEmotion(e.target.value)} />
          <textarea
            className="field-input min-h-[88px] sm:col-span-2"
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn-primary mt-4"
          onClick={() =>
            void (async () => {
              await createJournal({
                traded_at: new Date(tradedAt).toISOString(),
                pair,
                direction,
                entry: numOrNull(entry),
                exit: numOrNull(exit),
                result: result || null,
                notes: notes || null,
                emotion: emotion || null,
              });
              setNotes("");
              setEmotion("");
              setEntry("");
              setExit("");
              setResult("");
              await load();
            })()
          }
        >
          Save entry
        </button>
      </section>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {loading ? <SkeletonRows /> : null}
      {!loading && items.length === 0 ? (
        <EmptyState title="No journal entries" description="Log your first trade to start building process history." />
      ) : null}

      <div className="space-y-2">
        {items.map((j) => (
          <article key={j.id} className="surface-panel flex flex-wrap items-start justify-between gap-3 p-5">
            <div>
              <p className="font-display text-lg font-semibold">
                {j.pair} · {j.direction.toUpperCase()}
              </p>
              <p className="mt-1 text-sm text-muted">
                {new Date(j.traded_at).toLocaleString()}
                {j.entry != null ? ` · Entry ${j.entry}` : ""}
                {j.exit != null ? ` · Exit ${j.exit}` : ""}
              </p>
              {j.result ? (
                <div className="mt-2">
                  <StatusBadge label={j.result} tone={statusTone(j.result)} />
                </div>
              ) : null}
              {j.emotion ? <p className="mt-2 text-sm text-accent">{j.emotion}</p> : null}
              {j.notes ? <p className="mt-2 text-sm text-muted">{j.notes}</p> : null}
            </div>
            <button
              type="button"
              className="text-sm text-[var(--danger)]"
              onClick={() =>
                void (async () => {
                  await deleteJournal(j.id);
                  await load();
                })()
              }
            >
              Delete
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
