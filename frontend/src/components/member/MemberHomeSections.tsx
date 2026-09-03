"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { LandingHookVideoPlayer } from "@/components/landing/LandingHookVideoPlayer";
import type { MemberHomeContent } from "@/services/member-home";
import { useT } from "@/i18n/useT";

type Props = {
  content: MemberHomeContent;
  firstName: string;
};

function qrFallbackUrl(link: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(link)}`;
}

export function MemberHomeSections({ content, firstName }: Props) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-6 sm:px-7 sm:py-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_80%_at_100%_0%,var(--glow),transparent_60%)]" />
        <div className="relative max-w-2xl">
          <p className="section-kicker">{t("member.memberDesk")}</p>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight md:text-[2.35rem]">
            {t("member.welcomeBack", { name: firstName })}
          </h1>
          <p className="mt-2.5 text-sm leading-relaxed text-muted md:text-[0.95rem]">{t("member.homeIntro")}</p>
        </div>
      </section>

      {content.welcome ? (
        <section className="space-y-3">
          <div>
            <p className="section-kicker">{t("member.welcomeVideoKicker")}</p>
            <h2 className="font-display mt-1 text-xl font-semibold tracking-tight">{content.welcome.title}</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
            <LandingHookVideoPlayer video={content.welcome} fallbackTitle={content.welcome.title} />
          </div>
        </section>
      ) : null}

      {content.referral ? (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <p className="section-kicker">{t("member.referralKicker")}</p>
          <h2 className="font-display mt-1 text-xl font-semibold tracking-tight">
            {content.referral.title || t("member.referralTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted">{t("member.referralBody")}</p>

          <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted">{t("member.referralLink")}</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input className="field-input min-w-0 flex-1" readOnly value={content.referral.link} />
                <button
                  type="button"
                  className="btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm"
                  onClick={() => void copyLink(content.referral!.link)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? t("member.referralCopied") : t("member.referralCopy")}
                </button>
              </div>
              <a href={content.referral.link} target="_blank" rel="noreferrer" className="text-sm font-medium text-accent hover:underline">
                {t("member.referralOpen")}
              </a>
            </div>

            <div className="mx-auto rounded-2xl border border-[var(--border)] bg-white p-3 md:mx-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={content.referral.barcode_url || qrFallbackUrl(content.referral.link)}
                alt={t("member.referralBarcodeAlt")}
                className="h-48 w-48 object-contain"
              />
            </div>
          </div>
        </section>
      ) : null}

      {content.tutorial ? (
        <section className="space-y-3">
          <div>
            <p className="section-kicker">{t("member.tutorialVideoKicker")}</p>
            <h2 className="font-display mt-1 text-xl font-semibold tracking-tight">{content.tutorial.title}</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
            <LandingHookVideoPlayer video={content.tutorial} fallbackTitle={content.tutorial.title} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
