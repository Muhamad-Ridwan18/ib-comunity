"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { getOnboarding } from "@/services/onboarding";
import { getMemberHome, type MemberHomeContent } from "@/services/member-home";
import { isBrowseOnly, isVerifiedMember, membershipCta } from "@/lib/membership";
import { OnboardingProgressTracker } from "@/components/member/OnboardingProgressTracker";
import { MemberHomeSections } from "@/components/member/MemberHomeSections";
import { NewMemberWelcome, VerifiedWelcome } from "@/components/member/MemberWelcome";
import { Skeleton } from "@/components/ui/Skeleton";
import type { OnboardingProgress } from "@/services/onboarding";
import { useT } from "@/i18n/useT";
import { USER_STATUS } from "@/constants";
import Link from "next/link";
import { ROUTES } from "@/constants";

const emptyContent: MemberHomeContent = {
  welcome: null,
  tutorial: null,
  referral: null,
};

export default function MemberDashboardPage() {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const verified = isVerifiedMember(user);
  const firstName = user?.profile?.full_name?.split(" ")[0] || t("status.member");
  const pending = user?.status === USER_STATUS.pending_verification;
  const cta = membershipCta(user?.status);

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<MemberHomeContent>(emptyContent);
  const [onboarding, setOnboarding] = useState<OnboardingProgress | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    let alive = true;
    void (async () => {
      setLoading(true);
      try {
        const [homeRes, obRes] = await Promise.all([
          getMemberHome().catch(() => null),
          !verified ? getOnboarding().catch(() => null) : Promise.resolve(null),
        ]);
        if (!alive) return;
        if (homeRes?.success && homeRes.data) setContent(homeRes.data);
        if (obRes?.success && obRes.data) setOnboarding(obRes.data);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [hydrated, verified]);

  const showFunnel = !verified;
  const hasConfiguredContent = Boolean(content.welcome || content.tutorial || content.referral);

  return (
    <div className="space-y-8">
      <NewMemberWelcome />
      <VerifiedWelcome />

      {showFunnel ? (
        <OnboardingProgressTracker progress={onboarding} status={user?.status} pending={pending} />
      ) : null}

      {loading || !hydrated ? (
        <div className="space-y-4">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : hasConfiguredContent ? (
        <MemberHomeSections content={content} firstName={firstName} />
      ) : (
        <section className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <h2 className="font-display text-xl font-semibold">{t("member.homeEmptyTitle")}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted">{t("member.homeEmptyBody")}</p>
          {!verified ? (
            <Link href={cta.href} className="btn-primary mt-5 inline-flex">
              {t(cta.labelKey)}
            </Link>
          ) : (
            <Link href={ROUTES.psychology} className="btn-primary mt-5 inline-flex">
              {t("member.exploreModules")}
            </Link>
          )}
        </section>
      )}

      {!verified && isBrowseOnly(user?.status) ? (
        <p className="text-center text-sm text-muted">{t("member.freeWhileVerifying")}</p>
      ) : null}
    </div>
  );
}
