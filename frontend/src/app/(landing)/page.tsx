"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, LineChart, Play, Radio, Users } from "lucide-react";
import { ROUTES } from "@/constants";
import { listContents, type ContentItem } from "@/services/content";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { articleCoverStyle, mediaCoverStyle } from "@/lib/media-cover";
import { useT } from "@/i18n/useT";

const featureDefs = [
  { icon: BookOpen, titleKey: "landing.featureQuality", bodyKey: "landing.featureQualityBody" },
  { icon: LineChart, titleKey: "landing.featureAnalysis", bodyKey: "landing.featureAnalysisBody" },
  { icon: Radio, titleKey: "landing.featureSignals", bodyKey: "landing.featureSignalsBody" },
  { icon: Users, titleKey: "landing.featureCommunity", bodyKey: "landing.featureCommunityBody" },
] as const;

const stepKeys = ["landing.step1", "landing.step2", "landing.step3", "landing.step4", "landing.step5"] as const;

const faqDefs = [
  { qKey: "landing.faq1q", aKey: "landing.faq1a" },
  { qKey: "landing.faq2q", aKey: "landing.faq2a" },
  { qKey: "landing.faq3q", aKey: "landing.faq3a" },
] as const;

const signalPreview = [
  { pair: "XAUUSD", dir: "buy", entry: "2335.5", note: "Sweep → continuation" },
  { pair: "EURUSD", dir: "sell", entry: "1.0842", note: "HTF supply rejection" },
  { pair: "GBPUSD", dir: "buy", entry: "1.2650", note: "Asia low reclaim" },
];

export default function LandingPage() {
  const { t, ts } = useT();
  const [articles, setArticles] = useState<ContentItem[]>([]);
  const [hookVideo, setHookVideo] = useState<ContentItem | null>(null);
  const [tab, setTab] = useState<"academy" | "analysis" | "signal">("academy");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [landing, academy, analysis] = await Promise.all([
          listContents({ module: "landing" }),
          listContents({ module: "academy" }),
          listContents({ module: "daily_analysis" }),
        ]);
        if (!alive) return;
        const landingItems = landing.success && landing.data ? landing.data : [];
        setHookVideo(landingItems.find((i) => i.type === "video") ?? landingItems[0] ?? null);
        const pool =
          tab === "analysis"
            ? analysis.success && analysis.data
              ? analysis.data
              : []
            : academy.success && academy.data
              ? academy.data
              : landingItems;
        setArticles(pool.slice(0, 6));
      } catch {
        if (alive) setArticles([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [tab]);

  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_70%_10%,rgba(0,82,255,0.14),transparent_55%),linear-gradient(180deg,#ffffff_0%,var(--background)_100%)] dark:bg-[radial-gradient(ellipse_70%_60%_at_70%_10%,rgba(0,82,255,0.18),transparent_55%),linear-gradient(180deg,var(--background),var(--background))]" />
        <div className="relative mx-auto grid max-w-6xl items-end gap-10 px-4 pb-16 pt-16 md:grid-cols-[1.05fr_0.95fr] md:pb-24 md:pt-24">
          <div className="animate-rise">
            <p className="font-display text-5xl font-semibold tracking-tight text-[var(--foreground)] md:text-6xl lg:text-7xl">
              IB Community
            </p>
            <h1 className="mt-5 max-w-lg text-xl font-medium leading-snug tracking-tight text-[var(--foreground)] md:text-2xl">
              {t("landing.tagline")}
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted">{t("landing.heroBody")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={ROUTES.register} className="btn-primary px-6 py-3">
                {t("nav.joinNow")}
              </Link>
              <Link href="#hook" className="btn-ghost px-6 py-3">
                {t("landing.watchVideo")}
              </Link>
            </div>
          </div>

          <div
            id="hook"
            className="animate-rise-delay relative aspect-video overflow-hidden rounded-none border border-[var(--border)] bg-[var(--surface-2)] shadow-[var(--shadow)] md:rounded-2xl"
          >
            {hookVideo?.video_url ? (
              <iframe title={hookVideo.title} src={hookVideo.video_url} className="h-full w-full" allowFullScreen />
            ) : (
              <div
                className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-white"
                style={mediaCoverStyle(hookVideo?.slug || "hook", hookVideo?.thumbnail_url)}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                  <Play className="h-5 w-5 fill-current" />
                </span>
                <p className="font-display text-lg font-semibold">{hookVideo?.title || t("landing.hookTitle")}</p>
                <p className="max-w-sm text-sm text-white/75">
                  {hookVideo?.excerpt || t("landing.hookBody")}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)] bg-[var(--card)]" id="benefits">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {featureDefs.map((f) => (
            <div key={f.titleKey} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <f.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-medium">{t(f.titleKey)}</p>
                <p className="mt-1 text-sm text-muted">{t(f.bodyKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20" id="how">
        <p className="section-kicker">{t("landing.processKicker")}</p>
        <h2 className="section-title mt-3">{t("landing.processTitle")}</h2>
        <ol className="mt-10 grid gap-4 sm:grid-cols-5">
          {stepKeys.map((key, i) => (
            <li key={key} className="relative text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                {i + 1}
              </span>
              <p className="mt-3 text-sm font-medium">{t(key)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16" id="articles">
        <div id="signals" className="sr-only" aria-hidden />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">{t("landing.previewKicker")}</p>
            <h2 className="section-title mt-3">{t("landing.previewTitle")}</h2>
          </div>
          <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-0.5">
            {(
              [
                ["academy", "landing.tabAcademy"],
                ["analysis", "landing.tabAnalysis"],
                ["signal", "landing.tabSignal"],
              ] as const
            ).map(([key, labelKey]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (key === "signal") {
                    setTab(key);
                    setLoading(false);
                    return;
                  }
                  setLoading(true);
                  setTab(key);
                }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  tab === key
                    ? "bg-white text-[var(--foreground)] shadow-sm dark:bg-[var(--card)]"
                    : "text-muted hover:text-[var(--foreground)]"
                }`}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8">
          {loading && tab !== "signal" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-52" />
              <Skeleton className="h-52" />
              <Skeleton className="h-52" />
            </div>
          ) : tab === "signal" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {signalPreview.map((s) => (
                <article key={s.pair} className="surface-panel relative overflow-hidden p-5">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--accent-soft),transparent_55%)] opacity-70" />
                  <div className="relative">
                    <div className="flex items-start justify-between">
                      <p className="font-display text-2xl font-semibold">{s.pair}</p>
                      <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-semibold uppercase text-accent">
                        {ts(s.dir)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted">{t("member.entry")} {s.entry}</p>
                    <p className="mt-3 text-sm text-muted">{s.note}</p>
                    <p className="mt-4 text-xs font-medium text-accent">{t("landing.unlockAfter")}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <EmptyState
              title={t("landing.libraryEmptyTitle")}
              description={t("landing.libraryEmptyBody")}
              actionLabel={t("nav.joinNow")}
              actionHref={ROUTES.register}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((item) => (
                <article key={item.id} className="surface-panel overflow-hidden">
                  <div className="relative h-36" style={articleCoverStyle(item.slug, item.thumbnail_url)}>
                    <span className="absolute left-3 top-3 rounded-md bg-black/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">
                      {item.type === "video" ? t("member.video") : t("member.article")}
                      {item.is_premium ? ` · ${t("member.membersOnly")}` : ""}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] uppercase tracking-wide text-muted">{item.category_name || item.module}</p>
                    <h3 className="mt-1 font-display text-lg font-semibold">{item.title}</h3>
                    {item.excerpt ? <p className="mt-2 line-clamp-2 text-sm text-muted">{item.excerpt}</p> : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16" id="faq">
        <p className="section-kicker">{t("landing.faqKicker")}</p>
        <h2 className="section-title mt-3">{t("landing.faqTitle")}</h2>
        <div className="mt-8 divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {faqDefs.map((item) => (
            <details key={item.qKey} className="group py-5">
              <summary className="cursor-pointer list-none font-medium marker:content-none">
                <span className="flex items-center justify-between gap-4">
                  {t(item.qKey)}
                  <span className="text-accent transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm text-muted">{t(item.aKey)}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[linear-gradient(135deg,#0052ff,#003bb8)] px-6 py-14 text-center text-white md:px-16">
          <div className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <h2 className="relative font-display text-3xl font-semibold tracking-tight md:text-4xl">
            {t("landing.ctaTitle")}
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-white/80">{t("landing.ctaBody")}</p>
          <Link
            href={ROUTES.register}
            className="relative mt-8 inline-flex rounded-xl bg-white px-6 py-3 text-sm font-semibold text-accent"
          >
            {t("nav.joinNow")}
          </Link>
        </div>
      </section>
    </>
  );
}
