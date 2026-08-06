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
import { useT } from "@/i18n/useT";

function isUnlocked(status?: string, role?: string) {
  return status === "verified" || role === "admin" || role === "super_admin";
}

export default function SignalsPage() {
  const { t } = useT();
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
        else setError(res.message || t("member.noSignalsBody"));
      } catch {
        if (alive) setError(t("member.noSignalsBody"));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [unlocked, status, t]);

  if (!unlocked) return <LockedModule title={t("member.signalsTitle")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("member.liveDesk")}
        title={t("member.signalsTitle")}
        description={t("member.signalsDesc")}
        actions={
          <MemberFilterSeg
            value={status}
            onChange={setStatus}
            options={[
              { value: "", label: t("common.all") },
              { value: "active", label: t("status.active") },
              { value: "closed", label: t("status.closed") },
              { value: "cancelled", label: t("status.cancelled") },
            ]}
          />
        }
      />

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {loading ? <SkeletonRows count={4} /> : null}

      {!loading && items.length === 0 ? (
        <EmptyState title={t("member.noSignalsTitle")} description={t("member.noSignalsBody")} />
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
                    {t("member.entry")} {s.entry}
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
              <p className="mt-3 text-xs text-muted">
                {t("member.published", { date: new Date(s.published_at).toLocaleString() })}
              </p>
            </MemberListRow>
          ))}
        </MemberList>
      ) : null}
    </div>
  );
}
