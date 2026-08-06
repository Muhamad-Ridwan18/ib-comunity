"use client";

import { useCallback, useEffect, useState } from "react";
import {
  approveVerification,
  getAdminVerification,
  listAdminVerifications,
  rejectVerification,
  type VerificationRequest,
} from "@/services/onboarding";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

type Detail = {
  request: VerificationRequest;
  user: { id: string; email: string; status: string; profile?: { full_name: string } };
};

const FILTERS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "", label: "All" },
] as const;

export default function AdminVerificationsPage() {
  const [items, setItems] = useState<VerificationRequest[]>([]);
  const [status, setStatus] = useState("pending");
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await listAdminVerifications({ status: status || undefined, page: 1 });
      if (res.success && res.data) {
        setItems(res.data);
        if (selected && !res.data.some((i) => i.id === selected)) {
          setSelected(null);
          setDetail(null);
        }
      } else setError(res.message);
    } catch {
      setError("Failed to load verifications");
    } finally {
      setLoading(false);
    }
  }, [status, selected]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on filter only
  }, [status]);

  const openDetail = async (id: string) => {
    setSelected(id);
    setReason("");
    setError(null);
    try {
      const res = await getAdminVerification(id);
      if (res.success && res.data) setDetail(res.data);
    } catch {
      setError("Failed to load detail");
    }
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;

  return (
    <div className="-mx-4 -my-6 flex min-h-[calc(100vh-3rem)] flex-col md:-mx-6 lg:-mx-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] px-4 py-5 md:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight md:text-2xl">Verifications</h1>
          <p className="mt-1 text-sm text-muted">
            Review MT5 IB submissions
            {status === "pending" && !loading ? ` · ${items.length} in queue` : null}
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => {
                setStatus(f.value);
                setSelected(null);
                setDetail(null);
              }}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition sm:text-sm",
                status === f.value
                  ? "bg-white text-[var(--foreground)] shadow-sm dark:bg-[var(--card)]"
                  : "text-muted hover:text-[var(--foreground)]",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="border-b border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-2 text-sm text-[var(--danger)] md:px-6 lg:px-8">
          {error}
        </p>
      ) : null}

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.85fr)]">
        {/* List */}
        <div className="min-h-0 border-b border-[var(--border)] lg:border-b-0 lg:border-r">
          <div className="hidden grid-cols-[1.2fr_1fr_1fr_auto] gap-3 border-b border-[var(--border)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted md:grid md:px-6">
            <span>Submitted</span>
            <span>MT5</span>
            <span>Server</span>
            <span className="text-right">Status</span>
          </div>

          {loading ? (
            <div className="space-y-2 p-4 md:p-6">
              <div className="h-12 animate-pulse rounded-lg bg-[var(--surface-2)]" />
              <div className="h-12 animate-pulse rounded-lg bg-[var(--surface-2)]" />
              <div className="h-12 animate-pulse rounded-lg bg-[var(--surface-2)]" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <p className="font-medium">No requests</p>
              <p className="mt-1 max-w-xs text-sm text-muted">
                {status === "pending"
                  ? "The pending queue is clear."
                  : "Nothing matches this filter."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {items.map((item) => {
                const active = selected === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => void openDetail(item.id)}
                      className={cn(
                        "grid w-full grid-cols-1 gap-1 px-4 py-3.5 text-left transition md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center md:gap-3 md:px-6",
                        active ? "bg-accent-soft" : "hover:bg-[var(--surface-2)]",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm font-medium">{item.mt5_account}</p>
                        <p className="truncate text-xs text-muted md:hidden">{item.broker_server}</p>
                        <p className="mt-0.5 text-[11px] text-muted">
                          {item.created_at ? new Date(item.created_at).toLocaleString() : "—"}
                        </p>
                      </div>
                      <p className="hidden font-mono text-sm md:block">{item.mt5_account}</p>
                      <p className="hidden truncate text-sm text-muted md:block">{item.broker_server}</p>
                      <div className="md:justify-self-end">
                        <StatusBadge label={item.status} tone={statusTone(item.status)} />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Detail */}
        <aside className="flex min-h-[22rem] flex-col bg-[var(--card)] lg:min-h-0">
          {!detail ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
              <p className="text-sm font-medium">Select a request</p>
              <p className="mt-1 max-w-[14rem] text-sm text-muted">
                {pendingCount > 0 || status === "pending"
                  ? "Open a row to approve or reject MT5 verification."
                  : "Pick a verification from the list."}
              </p>
            </div>
          ) : (
            <>
              <div className="border-b border-[var(--border)] px-5 py-4 md:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-semibold">
                      {detail.user.profile?.full_name || "Member"}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-muted">{detail.user.email}</p>
                  </div>
                  <StatusBadge label={detail.request.status} tone={statusTone(detail.request.status)} />
                </div>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 md:px-6">
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">MT5</dt>
                    <dd className="mt-1 font-mono text-base font-medium">{detail.request.mt5_account}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Server</dt>
                    <dd className="mt-1 text-base font-medium">{detail.request.broker_server}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Account status</dt>
                    <dd className="mt-1 capitalize">{detail.user.status.replaceAll("_", " ")}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Submitted</dt>
                    <dd className="mt-1">
                      {detail.request.created_at
                        ? new Date(detail.request.created_at).toLocaleString()
                        : "—"}
                    </dd>
                  </div>
                </dl>

                {detail.request.proof_key ? (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Proof</p>
                    <p className="mt-1 break-all font-mono text-xs">{detail.request.proof_key}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted">No deposit proof uploaded.</p>
                )}

                {detail.request.rejection_reason ? (
                  <div className="rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/5 px-3 py-2.5 text-sm">
                    <p className="font-medium text-[var(--danger)]">Rejection reason</p>
                    <p className="mt-1 text-muted">{detail.request.rejection_reason}</p>
                  </div>
                ) : null}

                {detail.request.status === "pending" ? (
                  <label className="block space-y-1.5 text-sm">
                    <span className="text-muted">Rejection reason</span>
                    <textarea
                      className="field-input min-h-[100px]"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Required when rejecting"
                    />
                  </label>
                ) : null}
              </div>

              {detail.request.status === "pending" ? (
                <div className="sticky bottom-0 flex gap-2 border-t border-[var(--border)] bg-[var(--card)] px-5 py-4 md:px-6">
                  <button
                    type="button"
                    disabled={busy}
                    className="btn-primary flex-1 py-2.5"
                    onClick={() =>
                      void (async () => {
                        if (!selected) return;
                        setBusy(true);
                        setError(null);
                        try {
                          await approveVerification(selected);
                          setDetail(null);
                          setSelected(null);
                          await load();
                        } catch {
                          setError("Approve failed");
                        } finally {
                          setBusy(false);
                        }
                      })()
                    }
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className="flex-1 rounded-xl border border-[var(--danger)] px-4 py-2.5 text-sm font-medium text-[var(--danger)] transition hover:bg-[var(--danger)]/5 disabled:opacity-50"
                    onClick={() =>
                      void (async () => {
                        if (!selected || !reason.trim()) {
                          setError("Rejection reason is required");
                          return;
                        }
                        setBusy(true);
                        setError(null);
                        try {
                          await rejectVerification(selected, reason.trim());
                          setDetail(null);
                          setSelected(null);
                          await load();
                        } catch {
                          setError("Reject failed");
                        } finally {
                          setBusy(false);
                        }
                      })()
                    }
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
