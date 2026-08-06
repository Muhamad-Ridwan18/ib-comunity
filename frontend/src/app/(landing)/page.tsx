"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  CirclePlay,
  Clock3,
  LineChart,
  Play,
  Quote,
  Radio,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
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

const signalPreview = [
  { pair: "XAUUSD", dir: "buy", entry: "2335.5", note: "Sweep → continuation" },
  { pair: "EURUSD", dir: "sell", entry: "1.0842", note: "HTF supply rejection" },
  { pair: "GBPUSD", dir: "buy", entry: "1.2650", note: "Asia low reclaim" },
];

type MarketQuote = {
  symbol: string;
  name: string;
  close: number;
  change: number;
  percent_change: number;
};

function sparklinePoints(change: number) {
  const seed = Math.max(6, Math.min(22, Math.round(Math.abs(change) * 10)));
  const values = [28, 34, 31, 38, 36, 44, 41, 47, 52, 56, 61, 58].map((v, i) =>
    change >= 0 ? v + ((seed + i * 2) % 12) : v - ((seed + i * 2) % 10),
  );
  const min = Math.min(...values);
  const max = Math.max(...values);
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - ((v - min) / Math.max(1, max - min)) * 100;
      return `${x},${y}`;
    })
    .join(" ");
}

export default function LandingPage() {
  const { t, ts, locale } = useT();
  const [articles, setArticles] = useState<ContentItem[]>([]);
  const [hookVideo, setHookVideo] = useState<ContentItem | null>(null);
  const [tab, setTab] = useState<"academy" | "analysis" | "signal">("academy");
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);

  async function loadQuotes(signal?: AbortSignal) {
    const res = await fetch("/api/market", { cache: "no-store", signal });
    const json = (await res.json()) as { ok?: boolean; data?: MarketQuote[] };
    if (json.ok && json.data) setQuotes(json.data);
  }

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

  useEffect(() => {
    const controller = new AbortController();
    void loadQuotes(controller.signal).catch(() => {
      /* ignore market widget failure */
    });
    const timer = window.setInterval(() => {
      void loadQuotes(controller.signal).catch(() => {
        /* ignore market widget failure */
      });
    }, 45_000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  const copy =
    locale === "id"
      ? {
          trusted: "Komunitas Trading Terpercaya",
          heroTitleA: "Belajar Trading.",
          heroTitleB: "Konsisten.",
          heroTitleC: "Profit.",
          heroTitleD: "Bersama IB.",
          heroSub:
            "Materi berkualitas, analisis harian, sinyal real-time, dan komunitas aktif untuk trader yang ingin berkembang.",
          joinNow: "Gabung Sekarang",
          demo: "Lihat Demo",
          memberCount: "10.000+ Member Aktif",
          statsA: "Materi Berkualitas",
          statsABody: "Belajar trading dari dasar hingga strategi lanjutan dengan materi terstruktur.",
          statsB: "Analisis Harian",
          statsBBody: "Analisis market setiap hari untuk membantu kamu mengambil keputusan.",
          statsC: "Sinyal Real-time",
          statsCBody: "Dapatkan sinyal buy/sell dengan entry, SL, dan TP yang jelas.",
          statsD: "Komunitas Aktif",
          statsDBody: "Bergabung dengan ribuan trader aktif dalam komunitas member.",
          process: "PROSES",
          processTitle: "Cara Bergabung",
          proofA: "Member Aktif",
          proofB: "Analisis Dibagikan",
          proofC: "Verifikasi Berhasil",
          proofD: "Support Aktif",
          testimonialTitle: "Apa Kata Member?",
          ctaTitle: "Siap masuk desk member?",
          ctaBody:
            "Gabung Santara Pips, verifikasi broker, dan akses semua fitur premium untuk trading kamu.",
          ctaBtn: "Gabung Sekarang",
          marketPulse: "Pulse Market Live",
          marketLive: "Quote Live",
        }
      : {
          trusted: "Trusted Trading Community",
          heroTitleA: "Learn Trading.",
          heroTitleB: "Consistent.",
          heroTitleC: "Profit.",
          heroTitleD: "With IB.",
          heroSub:
            "Premium education, daily analysis, real-time signals, and an active community for traders who want to grow.",
          joinNow: "Join Now",
          demo: "Watch Demo",
          memberCount: "10,000+ Active Members",
          statsA: "Quality Materials",
          statsABody: "Learn from basics to advanced strategies with structured lessons.",
          statsB: "Daily Analysis",
          statsBBody: "Daily market reads to help you make better decisions.",
          statsC: "Real-time Signals",
          statsCBody: "Get clear buy/sell setups with entry, SL, and TP.",
          statsD: "Active Community",
          statsDBody: "Join thousands of active traders in our member community.",
          process: "PROCESS",
          processTitle: "How to Join",
          proofA: "Active Members",
          proofB: "Analyses Shared",
          proofC: "Successful Verifications",
          proofD: "Live Support",
          testimonialTitle: "What Members Say",
          ctaTitle: "Ready for the member desk?",
          ctaBody:
            "Join Santara Pips, verify your broker, and unlock all premium features for your trading journey.",
          ctaBtn: "Join Now",
          marketPulse: "Live Market Pulse",
          marketLive: "Live quotes",
        };

  const testimonials =
    locale === "id"
      ? [
          {
            name: "Muhamad Ridwan",
            role: "Swing Trader",
            text: "Materi sangat lengkap dan sinyalnya gampang dipahami. Profit konsisten mulai terasa.",
          },
          {
            name: "Farel Aditya",
            role: "Forex Trader",
            text: "Analisis hariannya detail banget, jadi saya lebih percaya diri saat entry.",
          },
          {
            name: "Dina Pratama",
            role: "Scalper",
            text: "Komunitasnya aktif, support cepat, dan dashboard member enak banget dipakai.",
          },
        ]
      : [
          {
            name: "Muhamad Ridwan",
            role: "Swing Trader",
            text: "The lessons are complete and signal execution is easy to follow. My consistency improved a lot.",
          },
          {
            name: "Farel Aditya",
            role: "Forex Trader",
            text: "Daily analysis is detailed, so I feel more confident every time I execute.",
          },
          {
            name: "Dina Pratama",
            role: "Scalper",
            text: "Active community, fast support, and a member dashboard that feels truly premium.",
          },
        ];

  const dashboardLabels =
    locale === "id"
      ? {
          overview: "Ringkasan",
          performance: "Performa",
          winrate: "Winrate",
          rr: "RR Rata-rata",
          signals: "Sinyal",
          members: "Member",
          latestSignals: "Sinyal Terbaru",
          proof: "Bukti Sosial",
        }
      : {
          overview: "Overview",
          performance: "Performance",
          winrate: "Winrate",
          rr: "Avg RR",
          signals: "Signals",
          members: "Members",
          latestSignals: "Latest Signals",
          proof: "Social Proof",
          marketLive: "Live quotes",
        };

  const liveQuotes = quotes.length
    ? quotes
    : [
        { symbol: "XAU/USD", name: "Gold", close: 2350.4, change: 12.8, percent_change: 0.55 },
        { symbol: "EUR/USD", name: "Euro", close: 1.0842, change: -0.0011, percent_change: -0.1 },
        { symbol: "GBP/USD", name: "Pound", close: 1.265, change: 0.0024, percent_change: 0.19 },
        { symbol: "BTC/USD", name: "Bitcoin", close: 62450, change: 880, percent_change: 1.43 },
      ];

  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_75%_10%,rgba(0,82,255,0.22),transparent_58%),radial-gradient(ellipse_40%_35%_at_20%_0%,rgba(0,82,255,0.14),transparent_60%)] dark:bg-[radial-gradient(ellipse_60%_50%_at_75%_10%,rgba(59,130,246,0.28),transparent_58%),radial-gradient(ellipse_40%_35%_at_20%_0%,rgba(59,130,246,0.16),transparent_60%)]" />
        <div className="border-b border-[var(--border)]/70 bg-[var(--card)]/55 backdrop-blur">
          <div className="mx-auto flex max-w-6xl overflow-hidden px-4">
            <div className="market-ticker py-2">
              {[...liveQuotes, ...liveQuotes].map((quote, i) => {
                const positive = quote.change >= 0;
                return (
                  <div
                    key={`${quote.symbol}-${i}`}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-[11px]"
                  >
                    <span className="font-semibold">{quote.symbol}</span>
                    <span className="text-muted">
                      {quote.close >= 100 ? quote.close.toLocaleString() : quote.close.toFixed(4)}
                    </span>
                    <span className={positive ? "text-emerald-500" : "text-rose-500"}>
                      {positive ? "+" : ""}
                      {quote.percent_change.toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-14 md:grid-cols-[1.02fr_0.98fr] md:pb-20 md:pt-16">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-[11px] font-semibold text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              {copy.trusted}
            </span>
            <h1 className="mt-5 max-w-xl font-display text-4xl font-semibold leading-[1.03] tracking-tight md:text-6xl">
              {copy.heroTitleA}
              <br />
              {copy.heroTitleB}{" "}
              <span className="bg-[linear-gradient(120deg,#0052ff,#65a3ff)] bg-clip-text text-transparent">
                {copy.heroTitleC}
              </span>
              <br />
              {copy.heroTitleD}
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted md:text-base">{copy.heroSub}</p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link href={ROUTES.register} className="btn-primary gap-2 px-5 py-2.5">
                {copy.joinNow}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#hook" className="btn-ghost gap-2 px-5 py-2.5">
                <CirclePlay className="h-4 w-4" />
                {copy.demo}
              </Link>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex -space-x-2">
                {["AA", "TR", "FX", "IB", "PT"].map((a) => (
                  <span
                    key={a}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--card)] bg-accent text-[10px] font-semibold text-white"
                  >
                    {a}
                  </span>
                ))}
              </div>
              <p className="text-xs font-medium text-muted">{copy.memberCount}</p>
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-3 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                  {copy.marketPulse}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Twelve Data · 45s
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {liveQuotes.map((quote) => {
                  const positive = quote.change >= 0;
                  return (
                    <div key={quote.symbol} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/70 px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold">{quote.symbol}</p>
                          <p className="text-[10px] text-muted">{quote.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold">
                            {quote.close >= 100 ? quote.close.toLocaleString() : quote.close.toFixed(4)}
                          </p>
                          <p className={`text-[10px] font-medium ${positive ? "text-emerald-500" : "text-rose-500"}`}>
                            {positive ? "+" : ""}
                            {quote.percent_change.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 h-8">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                          <polyline
                            fill="none"
                            stroke={positive ? "#22c55e" : "#fb7185"}
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={sparklinePoints(quote.percent_change)}
                          />
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            id="hook"
            className="animate-rise-delay relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[linear-gradient(140deg,#0b1326,#0b1532)] p-4 text-white shadow-[0_24px_80px_rgba(10,20,48,0.5)]"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/40 blur-3xl" />
            <div className="relative rounded-2xl border border-white/10 bg-[#0d1833]/90 p-4 backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-white/80">Santara Pips</p>
                <span className="rounded-md border border-white/15 px-2 py-1 text-[10px] text-white/80">
                  {dashboardLabels.overview}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {[
                  { label: dashboardLabels.winrate, value: "78.4%" },
                  { label: dashboardLabels.rr, value: "1:2.7" },
                  { label: dashboardLabels.signals, value: "342" },
                  { label: dashboardLabels.members, value: "10.2k" },
                ].map((x) => (
                  <div key={x.label} className="rounded-xl border border-white/10 bg-white/5 px-2 py-2">
                    <p className="text-[10px] text-white/60">{x.label}</p>
                    <p className="mt-0.5 text-xs font-semibold">{x.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/70">{dashboardLabels.performance}</p>
                  <p className="text-[10px] text-emerald-300">
                    {liveQuotes[0]
                      ? `${liveQuotes[0].change >= 0 ? "+" : ""}${liveQuotes[0].change.toFixed(2)}`
                      : "+120 pips"}
                  </p>
                </div>
                <div className="mt-3 h-24 rounded-lg border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),transparent)] p-2">
                  <div className="flex h-full items-end gap-1.5">
                    {(liveQuotes.length
                      ? liveQuotes.map((q, i) => 35 + Math.min(40, Math.max(4, Math.abs(q.percent_change) * 18 + i * 7)))
                      : [28, 34, 29, 45, 41, 52, 56, 62, 74, 71]
                    ).map((h, i) => (
                      <span
                        key={i}
                        className="w-full rounded-sm bg-[linear-gradient(180deg,#7bb1ff,#4d88ff)]/90"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-white/50">{dashboardLabels.latestSignals}</p>
                <div className="grid grid-cols-2 gap-2">
                {liveQuotes.slice(0, 2).map((quote, i) => (
                  <div key={quote.symbol} className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold">{quote.symbol}</p>
                      <span
                        className={`text-[10px] font-semibold ${
                          quote.change >= 0 ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        {quote.change >= 0 ? ts("buy") : ts("sell")}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-white/70">
                      {signalPreview[i]?.note || t("landing.hookBody")}
                    </p>
                    <div className="mt-2 h-8">
                      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                        <polyline
                          fill="none"
                          stroke={quote.change >= 0 ? "#4ade80" : "#fb7185"}
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={sparklinePoints(quote.percent_change)}
                        />
                      </svg>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
              {hookVideo?.video_url ? (
                <iframe title={hookVideo.title} src={hookVideo.video_url} className="aspect-video w-full" allowFullScreen />
              ) : (
                <div
                  className="flex aspect-video items-center justify-center gap-2 text-white/90"
                  style={mediaCoverStyle(hookVideo?.slug || "hook", hookVideo?.thumbnail_url)}
                >
                  <Play className="h-5 w-5 fill-current" />
                  <p className="text-sm font-medium">{hookVideo?.title || t("landing.hookTitle")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)] bg-[var(--card)]" id="benefits">
        <div className="mx-auto grid max-w-6xl gap-3 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {featureDefs.map((f) => (
            <div key={f.titleKey} className="surface-panel flex gap-3 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
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

      <section className="mx-auto max-w-6xl px-4 py-14" id="how">
        <p className="section-kicker">{copy.process}</p>
        <h2 className="section-title mt-2">{copy.processTitle}</h2>
        <ol className="mt-8 grid gap-3 sm:grid-cols-5">
          {stepKeys.map((key, i) => (
            <li key={key} className="relative rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-center">
              {i < stepKeys.length - 1 ? (
                <span className="absolute -right-4 top-1/2 hidden h-px w-8 -translate-y-1/2 bg-[var(--border)] sm:block" />
              ) : null}
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-accent/30 bg-accent-soft text-sm font-bold text-accent">
                {i + 1}
              </span>
              <p className="mt-3 text-xs font-medium">{t(key)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12" id="articles">
        <div id="signals" className="sr-only" aria-hidden />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">{t("landing.previewKicker")}</p>
            <h2 className="section-title mt-2">{t("landing.previewTitle")}</h2>
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

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, label: copy.proofA, value: "10.000+" },
            { icon: BarChart3, label: copy.proofB, value: "1.200+" },
            { icon: ShieldCheck, label: copy.proofC, value: "95%" },
            { icon: Clock3, label: copy.proofD, value: "24/7" },
          ].map((x) => (
            <article key={x.label} className="surface-panel p-4">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <x.icon className="h-4 w-4" />
              </span>
              <p className="mt-3 font-display text-2xl font-semibold">{x.value}</p>
              <p className="mt-1 text-xs text-muted">{x.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="section-kicker">{dashboardLabels.proof}</p>
              <h2 className="section-title mt-2">
                {locale === "id" ? "Kenapa trader betah di sini?" : "Why traders stay here"}
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
                {locale === "id"
                  ? "Bukan cuma tampilan keren, tapi struktur produk, edukasi, dan support dibuat jelas supaya member benar-benar nyaman belajar dan eksekusi."
                  : "This is not just polished design. The learning flow, desk analysis, and support structure are designed to make members comfortable learning and executing."}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  icon: BookOpen,
                  title: locale === "id" ? "Materi terstruktur" : "Structured lessons",
                  body:
                    locale === "id"
                      ? "Urutan belajar dari dasar sampai eksekusi live lebih jelas."
                      : "A clearer learning flow from basics to live execution.",
                },
                {
                  icon: LineChart,
                  title: locale === "id" ? "Analisis konsisten" : "Consistent analysis",
                  body:
                    locale === "id"
                      ? "Desk market read dibagikan rutin agar kamu tidak trading sendirian."
                      : "Desk market reads are shared consistently so you do not trade alone.",
                },
                {
                  icon: Radio,
                  title: locale === "id" ? "Signal yang actionable" : "Actionable signals",
                  body:
                    locale === "id"
                      ? "Entry, SL, TP, dan konteks setup dibuat ringkas dan cepat dibaca."
                      : "Entry, SL, TP, and setup context are concise and easy to scan.",
                },
                {
                  icon: Users,
                  title: locale === "id" ? "Komunitas aktif" : "Active community",
                  body:
                    locale === "id"
                      ? "Diskusi dan support tetap hidup setelah verifikasi selesai."
                      : "Discussion and support stay active long after verification is complete.",
                },
              ].map((item) => (
                <article key={item.title} className="surface-panel p-4">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <h3 className="mt-3 font-display text-lg font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12" id="faq">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="section-kicker">{t("landing.faqKicker")}</p>
            <h2 className="section-title mt-2">{copy.testimonialTitle}</h2>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {testimonials.map((x) => (
            <article key={x.name} className="surface-panel p-5">
              <Quote className="h-4 w-4 text-accent" />
              <p className="mt-3 text-sm leading-relaxed text-muted">{x.text}</p>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{x.name}</p>
                  <p className="text-xs text-muted">{x.role}</p>
                </div>
                <div className="flex items-center gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[linear-gradient(135deg,#0052ff,#003bb8)] px-6 py-12 text-center text-white md:px-14">
          <div className="pointer-events-none absolute -left-12 top-0 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -right-10 bottom-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <h2 className="relative font-display text-3xl font-semibold tracking-tight md:text-4xl">{copy.ctaTitle}</h2>
          <p className="relative mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/85 md:text-base">
            {copy.ctaBody}
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-2.5">
            <Link
              href={ROUTES.register}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-accent"
            >
              {copy.ctaBtn}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={ROUTES.login}
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              <Bot className="h-4 w-4" />
              {locale === "id" ? "Masuk Member" : "Member Login"}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
