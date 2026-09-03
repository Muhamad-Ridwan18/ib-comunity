"use client";

import Link from "next/link";
import { Calculator, CalendarDays, Wrench } from "lucide-react";
import { LockedModule } from "@/components/member/LockedModule";
import { PageHeader } from "@/components/ui/PageHeader";
import { ROUTES } from "@/constants";
import { useAuthStore } from "@/store/auth";
import { isVerifiedMember } from "@/lib/membership";
import { useT } from "@/i18n/useT";

export default function MemberToolsPage() {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const unlocked = isVerifiedMember(user);

  if (!unlocked) return <LockedModule title={t("member.tools")} />;

  const tools = [
    {
      href: ROUTES.compounding,
      icon: Calculator,
      title: t("member.compounding"),
      body: t("member.compoundingDesc"),
    },
    {
      href: ROUTES.calendar,
      icon: CalendarDays,
      title: t("member.calendar"),
      body: t("member.calendarDesc"),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader kicker={t("member.toolsKicker")} title={t("member.tools")} description={t("member.toolsDesc")} />

      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-accent/40 hover:bg-accent-soft/20"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <tool.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 font-display text-lg font-semibold">{tool.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{tool.body}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-muted">
            <Wrench className="h-5 w-5" />
          </span>
          <div>
            <p className="font-medium">{t("member.moreToolsTitle")}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{t("member.moreToolsBody")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
