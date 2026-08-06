"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adminCreateSignal,
  adminListSignals,
  adminPatchSignalStatus,
  type SignalItem,
} from "@/services/signals";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import {
  AdminEmpty,
  AdminFilterSeg,
  AdminPageHeader,
} from "@/components/admin/AdminChrome";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/useT";

function numOrNull(v: string) {
  if (!v.trim()) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function AdminSignalsPage() {
  const { t, ts, tr } = useT();
  const FILTERS = [
    { value: "", label: t("common.all") },
    { value: "active", label: t("status.active") },
    { value: "closed", label: t("status.closed") },
    { value: "cancelled", label: t("status.cancelled") },
  ];
  const [items, setItems] = useState<SignalItem[]>([]);
  const [status, setStatus] = useState("active");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pair, setPair] = useState("XAUUSD");
  const [direction, setDirection] = useState("buy");
  const [entry, setEntry] = useState("2350");
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [analysis, setAnalysis] = useState("");

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await adminListSignals();
      if (res.success && res.data) setItems(res.data);
      else setError(res.message || t("admin.loadFailed"));
    } catch {
      setError(t("admin.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => (status ? items.filter((s) => s.status === status) : items),
    [items, status],
  );

  return (
    <div>
      <AdminPageHeader
        title={t("admin.signalsTitle")}
        description={loading ? t("common.loading") : t("admin.setupsCount", { n: filtered.length })}
        actions={<AdminFilterSeg value={status} options={FILTERS} onChange={setStatus} />}
      />

      {error ? (
        <p className="border-b border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-2 text-sm text-[var(--danger)] md:px-6 lg:px-8">
          {error}
        </p>
      ) : null}

      <div className="grid lg:grid-cols-[minmax(16rem,19rem)_minmax(0,1fr)]">
        <aside className="border-b border-[var(--border)] bg-[var(--card)] lg:border-b-0 lg:border-r">
          <div className="px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{t("admin.publishSignal")}</p>
            <div className="mt-3 space-y-2.5">
              <input
                className="field-input py-2 text-sm"
                value={pair}
                onChange={(e) => setPair(e.target.value)}
                placeholder={t("admin.pair")}
              />
              <select
                className="field-input py-2 text-sm"
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
              >
                <option value="buy">{t("status.buy")}</option>
                <option value="sell">{t("status.sell")}</option>
              </select>
              <input
                className="field-input py-2 text-sm"
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                placeholder={t("admin.entry")}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="field-input py-2 text-sm"
                  value={sl}
                  onChange={(e) => setSl(e.target.value)}
                  placeholder={t("admin.sl")}
                />
                <input
                  className="field-input py-2 text-sm"
                  value={tp}
                  onChange={(e) => setTp(e.target.value)}
                  placeholder={t("admin.tp")}
                />
              </div>
              <textarea
                className="field-input min-h-[88px] text-sm"
                value={analysis}
                onChange={(e) => setAnalysis(e.target.value)}
                placeholder={t("admin.analysis")}
              />
              <button
                type="button"
                className="btn-primary w-full py-2.5 text-sm"
                disabled={busy}
                onClick={() =>
                  void (async () => {
                    const entryNum = Number(entry);
                    if (!Number.isFinite(entryNum)) {
                      setError(t("admin.entryMustBeNumber"));
                      return;
                    }
                    setBusy(true);
                    setError(null);
                    try {
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
                    } catch {
                      setError(t("admin.publishFailed"));
                    } finally {
                      setBusy(false);
                    }
                  })()
                }
              >
                {t("admin.publish")}
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="hidden grid-cols-[1fr_0.55fr_0.7fr_0.9fr_auto] gap-3 border-b border-[var(--border)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted md:grid md:px-6">
            <span>{t("admin.pair")}</span>
            <span>{t("admin.direction")}</span>
            <span>{t("admin.entry")}</span>
            <span>{t("common.status")}</span>
            <span className="text-right">{t("common.actions")}</span>
          </div>

          {loading ? (
            <div className="space-y-2 p-4 md:p-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-[var(--surface-2)]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <AdminEmpty
              title={t("admin.noSignals")}
              description={status ? t("admin.noSetupsForStatus", { status: ts(status) }) : t("admin.publishFromPanel")}
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {filtered.map((s) => (
                <li
                  key={s.id}
                  className={cn(
                    "grid gap-2 px-4 py-3 transition hover:bg-[var(--surface-2)] md:grid-cols-[1fr_0.55fr_0.7fr_0.9fr_auto] md:items-center md:gap-3 md:px-6",
                    s.status !== "active" && "opacity-80",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium font-mono">{s.pair}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {tr(s.published_at || s.created_at)}
                      {s.sl != null ? ` · SL ${s.sl}` : ""}
                      {s.tp != null ? ` · TP ${s.tp}` : ""}
                    </p>
                  </div>
                  <div>
                    <StatusBadge
                      label={s.direction}
                      tone={s.direction === "buy" ? "accent" : "danger"}
                    />
                  </div>
                  <p className="font-mono text-sm">{s.entry}</p>
                  <div className="flex flex-wrap gap-1">
                    <StatusBadge label={s.status} tone={statusTone(s.status)} />
                    {s.result ? <StatusBadge label={s.result} tone={statusTone(s.result)} /> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm md:justify-end">
                    {s.status === "active" ? (
                      <>
                        <button
                          type="button"
                          className="font-medium text-accent hover:underline"
                          disabled={busy}
                          onClick={() =>
                            void (async () => {
                              setBusy(true);
                              setError(null);
                              try {
                                await adminPatchSignalStatus(s.id, { status: "closed", result: "win" });
                                await load();
                              } catch {
                                setError(t("admin.actionFailed"));
                              } finally {
                                setBusy(false);
                              }
                            })()
                          }
                        >
                          {t("admin.closeWin")}
                        </button>
                        <button
                          type="button"
                          className="font-medium text-accent hover:underline"
                          disabled={busy}
                          onClick={() =>
                            void (async () => {
                              setBusy(true);
                              setError(null);
                              try {
                                await adminPatchSignalStatus(s.id, { status: "closed", result: "loss" });
                                await load();
                              } catch {
                                setError(t("admin.actionFailed"));
                              } finally {
                                setBusy(false);
                              }
                            })()
                          }
                        >
                          {t("admin.closeLoss")}
                        </button>
                        <button
                          type="button"
                          className="font-medium text-[var(--danger)] hover:underline"
                          disabled={busy}
                          onClick={() =>
                            void (async () => {
                              setBusy(true);
                              setError(null);
                              try {
                                await adminPatchSignalStatus(s.id, { status: "cancelled" });
                                await load();
                              } catch {
                                setError(t("admin.actionFailed"));
                              } finally {
                                setBusy(false);
                              }
                            })()
                          }
                        >
                          {t("common.cancel")}
                        </button>
                      </>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
