"use client";

import { useCallback, useEffect, useState } from "react";
import {
  approveVerification,
  getAdminVerification,
  listAdminVerifications,
  rejectVerification,
  type VerificationRequest,
} from "@/services/onboarding";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";

export default function AdminVerificationsPage() {
  const [items, setItems] = useState<VerificationRequest[]>([]);
  const [status, setStatus] = useState("pending");
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    request: VerificationRequest;
    user: { id: string; email: string; status: string; profile?: { full_name: string } };
  } | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await listAdminVerifications({ status: status || undefined, page: 1 });
      if (res.success && res.data) setItems(res.data);
      else setError(res.message);
    } catch {
      setError("Failed to load verifications");
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDetail = async (id: string) => {
    setSelected(id);
    setReason("");
    try {
      const res = await getAdminVerification(id);
      if (res.success && res.data) setDetail(res.data);
    } catch {
      setError("Failed to load detail");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader kicker="Admin" title="Verifications" description="Review MT5 submissions and proofs." />

      <div className="flex flex-wrap gap-2">
        {["pending", "approved", "rejected", ""].map((s) => (
          <button
            key={s || "all"}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              status === s ? "border-accent bg-accent-soft text-accent" : "border-[var(--border)] text-muted"
            }`}
          >
            {s || "all"}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-[1.25rem] border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">MT5</th>
                <th className="px-4 py-3 font-medium">Server</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className={`cursor-pointer border-b border-[var(--border)] hover:bg-accent-soft ${
                    selected === item.id ? "bg-accent-soft" : ""
                  }`}
                  onClick={() => void openDetail(item.id)}
                >
                  <td className="px-4 py-3">{item.mt5_account}</td>
                  <td className="px-4 py-3">{item.broker_server}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={item.status} tone={statusTone(item.status)} />
                  </td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8">
                    <EmptyState className="border-0 bg-transparent p-0" title="No requests" description="Queue is clear for this filter." />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="surface-panel p-5">
          {!detail ? (
            <p className="text-sm text-muted">Select a request to review.</p>
          ) : (
            <div className="space-y-3 text-sm">
              <h2 className="font-display text-lg font-semibold">Review</h2>
              <p>
                <span className="text-muted">User:</span> {detail.user.profile?.full_name || detail.user.email}
              </p>
              <p>
                <span className="text-muted">Email:</span> {detail.user.email}
              </p>
              <p>
                <span className="text-muted">MT5:</span> {detail.request.mt5_account}
              </p>
              <p>
                <span className="text-muted">Server:</span> {detail.request.broker_server}
              </p>
              <StatusBadge label={detail.request.status} tone={statusTone(detail.request.status)} />
              {detail.request.proof_key ? (
                <p>
                  <span className="text-muted">Proof key:</span> {detail.request.proof_key}
                </p>
              ) : null}

              {detail.request.status === "pending" ? (
                <>
                  <label className="block space-y-1.5">
                    <span>Rejection reason</span>
                    <textarea
                      className="field-input min-h-[88px]"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Required when rejecting"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      disabled={busy}
                      className="btn-primary"
                      onClick={() =>
                        void (async () => {
                          if (!selected) return;
                          setBusy(true);
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
                      className="rounded-xl border border-[var(--danger)] px-4 py-2 text-[var(--danger)]"
                      onClick={() =>
                        void (async () => {
                          if (!selected || !reason.trim()) {
                            setError("Rejection reason is required");
                            return;
                          }
                          setBusy(true);
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
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
