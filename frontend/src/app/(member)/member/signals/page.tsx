"use client";

import { useEffect, useState } from "react";
import { LockedModule } from "@/components/member/LockedModule";
import { listSignals, type SignalItem } from "@/services/signals";
import { useAuthStore } from "@/store/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { MemberFilterSeg, MemberList, MemberListRow } from "@/components/member/MemberChrome";

function isUnlocked(status?: string, role?: string) {
  return status === "verified" || role === "admin" || role === "super_admin";
}

export default function SignalsPage() {
  const user = useAuthStore((s) => s.user);
  const unlocked = isUnlocked(user?.status, user?.role);
  const [items, setItems] = useState<SignalItem[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!unlocked) {
      setLoading(false);
      return;
    }
    let alive = true;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await listSignals({ status: status || undefined });
        if (!alive) return;
        if (res.success && res.data) setItems(res.data);
        else setError(res.message || "Failed to load signals");
      } catch {
        if (alive) setError("Failed to load signals");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [unlocked, status]);

  if (!unlocked) return <LockedModule title="Signals" />;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Live desk"
        title="Signals"
        description="Pair setups with entry, SL/TP, and result tracking."
        actions={
          <MemberFilterSeg
            value={status}
            onChange={setStatus}
            options={[
              { value: "", label: "All" },
              { value: "active", label: "Active" },
              { value: "closed", label: "Closed" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
        }
      />

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {loading ? <SkeletonRows count={4} /> : null}

      {!loading && items.length === 0 ? (
        <EmptyState title="No signals" description="The desk has not published setups for this filter yet." />
      ) : null}

      {!loading && items.length > 0 ? (
        <MemberList>
          {items.map((s) => (
            <MemberListRow key={s.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold tracking-tight">
                    {s.pair}{" "}
                    <span className={s.direction === "buy" ? "text-accent" : "text-[var(--danger)]"}>
                      {s.direction.toUpperCase()}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Entry {s.entry}
                    {s.sl != null ? ` · SL ${s.sl}` : ""}
                    {s.tp != null ? ` · TP ${s.tp}` : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge label={s.status} tone={statusTone(s.status)} />
                  {s.result ? <StatusBadge label={s.result} tone={statusTone(s.result)} /> : null}
                </div>
              </div>
              {s.analysis ? <p className="mt-3 text-sm leading-relaxed text-muted">{s.analysis}</p> : null}
              <p className="mt-3 text-xs text-muted">Published {new Date(s.published_at).toLocaleString()}</p>
            </MemberListRow>
          ))}
        </MemberList>
      ) : null}
    </div>
  );
}
