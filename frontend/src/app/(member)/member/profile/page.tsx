"use client";

import { useAuthStore } from "@/store/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { MemberPanel } from "@/components/member/MemberChrome";
import { ROUTES } from "@/constants";
import { membershipCta } from "@/lib/membership";
import Link from "next/link";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const cta = membershipCta(user?.status);
  const initials =
    user?.profile?.full_name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "IB";

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Account"
        title="Profile"
        description="Your membership identity and verification status."
      />

      <MemberPanel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-sm font-semibold text-white">
              {initials}
            </div>
            <div>
              <p className="font-display text-xl font-semibold tracking-tight">
                {user?.profile?.full_name || "Member"}
              </p>
              <p className="mt-1 text-sm text-muted">{user?.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {user?.status ? <StatusBadge label={user.status} tone={statusTone(user.status)} /> : null}
                {user?.role ? <StatusBadge label={user.role} tone="muted" /> : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {user?.status !== "verified" ? (
              <Link href={cta.href} className="btn-primary">
                {cta.label}
              </Link>
            ) : null}
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                clearSession();
                window.location.href = ROUTES.login;
              }}
            >
              Sign out
            </button>
          </div>
        </div>

        <dl className="mt-8 grid gap-5 border-t border-[var(--border)] pt-6 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Telegram</dt>
            <dd className="mt-1.5 text-sm">{user?.profile?.telegram_username || "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Phone</dt>
            <dd className="mt-1.5 text-sm">{user?.profile?.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Timezone</dt>
            <dd className="mt-1.5 text-sm">{user?.profile?.timezone || "UTC"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Member since</dt>
            <dd className="mt-1.5 text-sm">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
            </dd>
          </div>
        </dl>
      </MemberPanel>
    </div>
  );
}
