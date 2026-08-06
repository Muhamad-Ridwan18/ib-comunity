"use client";

import { useEffect, useState } from "react";
import {
  adminCreateSignal,
  adminListSignals,
  adminPatchSignalStatus,
  type SignalItem,
} from "@/services/signals";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";

function numOrNull(v: string) {
  if (!v.trim()) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function AdminSignalsPage() {
  const [items, setItems] = useState<SignalItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pair, setPair] = useState("XAUUSD");
  const [direction, setDirection] = useState("buy");
  const [entry, setEntry] = useState("2350");
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [analysis, setAnalysis] = useState("");

  const load = async () => {
    setError(null);
    try {
      const res = await adminListSignals();
      if (res.success && res.data) setItems(res.data);
      else setError(res.message || "Failed to load");
    } catch {
      setError("Failed to load signals");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader kicker="Admin" title="Signals" description="Publish setups and close with results." />

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <section className="surface-panel p-5">
        <h2 className="font-display text-lg font-semibold">Publish signal</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className="field-input" value={pair} onChange={(e) => setPair(e.target.value)} placeholder="Pair" />
          <select className="field-input" value={direction} onChange={(e) => setDirection(e.target.value)}>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
          <input className="field-input" value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="Entry" />
          <input className="field-input" value={sl} onChange={(e) => setSl(e.target.value)} placeholder="SL" />
          <input className="field-input" value={tp} onChange={(e) => setTp(e.target.value)} placeholder="TP" />
          <textarea
            className="field-input min-h-[88px] sm:col-span-2"
            value={analysis}
            onChange={(e) => setAnalysis(e.target.value)}
            placeholder="Analysis"
          />
        </div>
        <button
          type="button"
          className="btn-primary mt-4"
          onClick={() =>
            void (async () => {
              const entryNum = Number(entry);
              if (!Number.isFinite(entryNum)) {
                setError("Entry must be a number");
                return;
              }
              await adminCreateSignal({
                pair,
                direction,
                entry: entryNum,
                sl: numOrNull(sl),
                tp: numOrNull(tp),
                status: "active",
                analysis: analysis || null,
              });
              setAnalysis("");
              await load();
            })()
          }
        >
          Publish
        </button>
      </section>

      <section className="overflow-hidden rounded-[1.25rem] border border-[var(--border)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] text-muted">
            <tr>
              <th className="px-4 py-3">Pair</th>
              <th className="px-4 py-3">Dir</th>
              <th className="px-4 py-3">Entry</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id} className="border-b border-[var(--border)]">
                <td className="px-4 py-3">{s.pair}</td>
                <td className="px-4 py-3 uppercase">{s.direction}</td>
                <td className="px-4 py-3">{s.entry}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <StatusBadge label={s.status} tone={statusTone(s.status)} />
                    {s.result ? <StatusBadge label={s.result} tone={statusTone(s.result)} /> : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {s.status === "active" ? (
                      <>
                        <button
                          type="button"
                          className="text-accent"
                          onClick={() =>
                            void (async () => {
                              await adminPatchSignalStatus(s.id, { status: "closed", result: "win" });
                              await load();
                            })()
                          }
                        >
                          Close Win
                        </button>
                        <button
                          type="button"
                          className="text-accent"
                          onClick={() =>
                            void (async () => {
                              await adminPatchSignalStatus(s.id, { status: "closed", result: "loss" });
                              await load();
                            })()
                          }
                        >
                          Close Loss
                        </button>
                        <button
                          type="button"
                          className="text-[var(--danger)]"
                          onClick={() =>
                            void (async () => {
                              await adminPatchSignalStatus(s.id, { status: "cancelled" });
                              await load();
                            })()
                          }
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
