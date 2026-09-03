"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { ROUTES } from "@/constants";
import { track } from "@/lib/analytics";
import { useT } from "@/i18n/useT";

export default function AboutPage() {
  const { t } = useT();

  const steps = [
    t("landing.step1"),
    t("landing.step2"),
    t("landing.step3"),
    t("landing.step4"),
    t("landing.step5"),
  ];

  const faqs = [
    { q: t("landing.faq1q"), a: t("landing.faq1a") },
    { q: t("landing.faq2q"), a: t("landing.faq2a") },
    { q: t("landing.faq3q"), a: t("landing.faq3a") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
      <p className="section-kicker">{t("about.kicker")}</p>
      <h1 className="section-title mt-2 max-w-2xl">{t("about.title")}</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted md:text-base">{t("about.intro")}</p>

      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <article className="surface-panel p-6">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <h2 className="mt-4 font-display text-xl font-semibold">{t("about.missionTitle")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t("about.missionBody")}</p>
        </article>
        <article className="surface-panel p-6">
          <h2 className="font-display text-xl font-semibold">{t("about.disclaimerTitle")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t("about.disclaimerBody")}</p>
        </article>
      </section>

      <section className="mt-12">
        <p className="section-kicker">{t("landing.processKicker")}</p>
        <h2 className="section-title mt-2">{t("landing.processTitle")}</h2>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, index) => (
            <li key={step} className="surface-panel p-4">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                {index + 1}
              </span>
              <p className="mt-3 text-sm font-medium">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <p className="section-kicker">{t("landing.faqKicker")}</p>
        <h2 className="section-title mt-2">{t("landing.faqTitle")}</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {faqs.map((item) => (
            <article key={item.q} className="surface-panel p-5">
              <h3 className="font-display text-base font-semibold">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
        <h2 className="font-display text-2xl font-semibold">{t("about.ctaTitle")}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{t("about.ctaBody")}</p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link
            href={ROUTES.register}
            className="btn-primary inline-flex gap-2"
            onClick={() => track("cta_click", { source: "about" })}
          >
            {t("nav.joinNow")}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href={ROUTES.home} className="btn-ghost">
            {t("landing.backHome")}
          </Link>
        </div>
      </section>
    </div>
  );
}
