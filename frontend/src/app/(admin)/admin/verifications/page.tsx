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
import {
  AdminBleed,
  AdminEmpty,
  AdminFilterSeg,
  AdminListRow,
  AdminPageHeader,
  AdminSplit,
  formatRelativeTime,
} from "@/components/admin/AdminChrome";
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
];

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <AdminBleed>
      <AdminPageHeader
        title="Verifications"
        description={
          status === "pending" && !loading ? `${items.length} in queue` : "Review MT5 IB submissions"
        }
        actions={
          <AdminFilterSeg
            value={status}
            options={FILTERS}
            onChange={(v) => {
              setStatus(v);
              setSelected(null);
              setDetail(null);
            }}
          />
        }
      />

      {error ? (
        <p className="border-b border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-2 text-sm text-[var(--danger)] md:px-6 lg:px-8">
          {error}
        </p>
      ) : null}

      <AdminSplit
        list={
          <>
            <div className="hidden grid-cols-[1.4fr_0.9fr_0.9fr_auto] gap-3 border-b border-[var(--border)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted md:grid md:px-6">
              <span>Member</span>
              <span>MT5</span>
              <span>Server</span>
              <span className="text-right">Status</span>
            </div>
            {loading ? (
              <div className="space-y-2 p-4 md:p-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-[var(--surface-2)]" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <AdminEmpty
                title="No requests"
                description={status === "pending" ? "The pending queue is clear." : "Nothing matches this filter."}
              />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {items.map((item) => {
                  const hours =
                    item.created_at && item.status === "pending"
                      ? (Date.now() - new Date(item.created_at).getTime()) / 36e5
                      : 0;
                  return (
                    <li key={item.id}>
                      <AdminListRow
                        active={selected === item.id}
                        onClick={() => void openDetail(item.id)}
                        className="md:grid-cols-[1.4fr_0.9fr_0.9fr_auto]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {item.user_full_name || item.user_email || "Member"}
                          </p>
                          <p className="truncate text-xs text-muted">{item.user_email || "—"}</p>
                          <p className={cn("mt-0.5 text-[11px]", hours > 24 ? "font-medium text-[var(--danger)]" : "text-muted")}>
                            {formatRelativeTime(item.created_at)}
                            {hours > 24 ? " · aging" : ""}
                          </p>
                        </div>
                        <p className="hidden font-mono text-sm md:block">{item.mt5_account}</p>
                        <p className="hidden truncate text-sm text-muted md:block">{item.broker_server}</p>
                        <div className="flex items-center gap-2 md:justify-self-end">
                          <span className="font-mono text-xs text-muted md:hidden">{item.mt5_account}</span>
                          <StatusBadge label={item.status} tone={statusTone(item.status)} />
                        </div>
                      </AdminListRow>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        }
        detail={
          !detail ? (
            <AdminEmpty title="Select a request" description="Open a row to approve or reject verification." />
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
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Account</dt>
                    <dd className="mt-1 capitalize">{detail.user.status.replaceAll("_", " ")}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Submitted</dt>
                    <dd className="mt-1">{formatRelativeTime(detail.request.created_at)}</dd>
                  </div>
                </dl>
                {detail.request.proof_key ? (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Proof on file</p>
                    <p className="mt-1 break-all font-mono text-xs text-muted">{detail.request.proof_key}</p>
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
          )
        }
      />
    </AdminBleed>
  );
}
