"use client";

import { LockedModule } from "@/components/member/LockedModule";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuthStore } from "@/store/auth";
import { isVerifiedMember } from "@/lib/membership";
import { useT } from "@/i18n/useT";

export default function MemberCalendarPage() {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const unlocked = isVerifiedMember(user);

  if (!unlocked) return <LockedModule title={t("member.calendar")} />;

  return (
    <div className="space-y-6">
      <PageHeader kicker={t("member.toolsKicker")} title={t("member.calendar")} description={t("member.calendarDesc")} />
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center">
        <p className="font-display text-lg font-semibold">{t("member.comingSoonTitle")}</p>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted">{t("member.calendarSoonBody")}</p>
      </div>
    </div>
  );
}
