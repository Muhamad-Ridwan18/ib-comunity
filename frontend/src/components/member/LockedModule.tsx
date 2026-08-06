"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { membershipCta } from "@/lib/membership";
import { useT } from "@/i18n/useT";

export function LockedModule({ title }: { title: string }) {
  const { t } = useT();
  const status = useAuthStore((s) => s.user?.status);
  const cta = membershipCta(status);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_100%_0%,var(--glow),transparent_55%)]" />
      <div className="relative flex flex-col items-start gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-12">
        <div className="max-w-lg">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Lock className="h-4 w-4" />
          </span>
          <p className="section-kicker mt-5">{t("member.membersOnly")}</p>
          <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t("member.lockedModuleBody")}</p>
        </div>
        <Link href={cta.href} className="btn-primary shrink-0">
          {t(cta.labelKey)}
        </Link>
      </div>
    </div>
  );
}
