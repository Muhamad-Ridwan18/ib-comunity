"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CirclePlay,
  LineChart,
  Play,
  Quote,
  Radio,
  ShieldCheck,
  Users,
} from "lucide-react";
import { ROUTES } from "@/constants";
import { track } from "@/lib/analytics";
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

const signalPreview = [
  { pair: "XAUUSD", dir: "buy", entry: "—", note: "Contoh format setup · bukan rekomendasi live" },
  { pair: "EURUSD", dir: "sell", entry: "—", note: "Entry, SL, TP, dan konteks pasar" },
  { pair: "GBPUSD", dir: "buy", entry: "—", note: "Terbuka setelah verifikasi member" },
];

type MarketQuote = {
  symbol: string;
  name: string;
  close: number;
  change: number;
  percent_change: number;
};

export default function LandingPage() {
  const { t, ts, locale } = useT();
  const [articles, setArticles] = useState<ContentItem[]>([]);
  const [hookVideo, setHookVideo] = useState<ContentItem | null>(null);
  const [tab, setTab] = useState<"academy" | "analysis" | "signal">("academy");
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [marketLive, setMarketLive] = useState(false);

  async function loadQuotes(signal?: AbortSignal) {
    const res = await fetch("/api/market", { cache: "no-store", signal });
    const json = (await res.json()) as { ok?: boolean; data?: MarketQuote[] };
    if (json.ok && json.data && json.data.length > 0) {
      setQuotes(json.data);
      setMarketLive(true);
    } else {
      setQuotes([]);
      setMarketLive(false);
    }
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
      setMarketLive(false);
    });
    const timer = window.setInterval(() => {
      void loadQuotes(controller.signal).catch(() => {
        setMarketLive(false);
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
          trusted: "Edukasi · Analisis · Komunitas",
          heroTitleA: "Belajar Trading.",
          heroTitleB: "Analisis Pasar.",
          heroTitleC: "Komunitas.",
          heroTitleD: "Bersama Santara Pips.",
          heroSub:
            "Platform edukasi dan analisis untuk trader yang ingin belajar dengan struktur jelas — bukan janji profit.",
          joinNow: "Daftar Gratis",
          demo: "Lihat Demo",
          processTeaser: "Setelah daftar, selesaikan 5 langkah verifikasi di dashboard member untuk membuka fitur premium.",
          processCta: "Mulai dari sini",
          valueA: "Edukasi Terstruktur",
          valueABody: "Pelajaran academy dari dasar hingga eksekusi dengan alur yang jelas.",
          valueB: "Analisis Harian",
          valueBBody: "Bacaan pasar dari desk dengan level dan invalidasi.",
          valueC: "Komunitas Privat",
          valueCBody: "Diskusi dan support setelah verifikasi MT5 selesai.",
          valueD: "Bukan Janji Hasil",
          valueDBody: "Kami fokus pada edukasi dan analisis — keputusan trading tetap di tangan Anda.",
          testimonialTitle: "Pengalaman Member",
          ctaTitle: "Siap mulai perjalanan trading Anda?",
          ctaBody:
            "Daftar gratis, jelajahi edukasi publik, lalu selesaikan verifikasi saat siap membuka academy, analisis, dan sinyal.",
          ctaBtn: "Daftar Sekarang",
          marketLive: "Data pasar · update ~45 detik",
          marketUnavailable: "Data pasar sementara tidak tersedia",
          deskPreview: "Pratinjau desk member",
        }
      : {
          trusted: "Education · Analysis · Community",
          heroTitleA: "Learn Trading.",
          heroTitleB: "Market Analysis.",
          heroTitleC: "Community.",
          heroTitleD: "With Santara Pips.",
          heroSub:
            "An education and analysis platform for traders who want clear structure — not profit promises.",
          joinNow: "Register Free",
          demo: "Watch Demo",
          processTeaser:
            "After registering, complete the 5-step verification in your member dashboard to unlock premium features.",
          processCta: "Start here",
          valueA: "Structured Education",
          valueABody: "Academy lessons from basics to execution with a clear learning path.",
          valueB: "Daily Analysis",
          valueBBody: "Desk market reads with levels and invalidation.",
          valueC: "Private Community",
          valueCBody: "Discussion and support after MT5 verification is complete.",
          valueD: "No Result Promises",
          valueDBody: "We focus on education and analysis — trading decisions remain yours.",
          testimonialTitle: "Member Experiences",
          ctaTitle: "Ready to start your trading journey?",
          ctaBody:
            "Register free, explore public education, then complete verification when you're ready for academy, analysis, and signals.",
          ctaBtn: "Register Now",
          marketLive: "Market data · ~45s refresh",
          marketUnavailable: "Market data temporarily unavailable",
          deskPreview: "Member desk preview",
        };

  const testimonials =
    locale === "id"
      ? [
          {
            name: "Muhamad Ridwan",
            role: "Swing Trader",
            text: "Materinya terstruktur dan sinyalnya mudah dipahami. Saya lebih fokus belajar proses, bukan mengejar hasil.",
          },
          {
            name: "Farel Aditya",
            role: "Forex Trader",
            text: "Analisis hariannya detail, jadi saya punya konteks sebelum mengambil keputusan sendiri.",
          },
          {
            name: "Dina Pratama",
            role: "Scalper",
            text: "Komunitasnya aktif dan dashboard member jelas menunjukkan langkah verifikasi berikutnya.",
          },
        ]
      : [
          {
            name: "Muhamad Ridwan",
            role: "Swing Trader",
            text: "Lessons are structured and signals are easy to read. I focus on the process, not chasing results.",
          },
          {
            name: "Farel Aditya",
            role: "Forex Trader",
            text: "Daily analysis gives me context before I make my own trading decisions.",
          },
          {
            name: "Dina Pratama",
            role: "Scalper",
            text: "Active community and the member dashboard clearly shows the next verification step.",
          },
        ];

  const deskModules =
    locale === "id"
      ? [
          { label: "Academy", desc: "Pelajaran terstruktur" },
          { label: "Analisis", desc: "Bacaan harian desk" },
          { label: "Sinyal", desc: "Setup edukatif" },
          { label: "Telegram", desc: "Komunitas privat" },
        ]
      : [
          { label: "Academy", desc: "Structured lessons" },
          { label: "Analysis", desc: "Daily desk reads" },
          { label: "Signals", desc: "Educational setups" },
          { label: "Telegram", desc: "Private community" },
        ];

  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_75%_10%,rgba(0,82,255,0.22),transparent_58%),radial-gradient(ellipse_40%_35%_at_20%_0%,rgba(0,82,255,0.14),transparent_60%)] dark:bg-[radial-gradient(ellipse_60%_50%_at_75%_10%,rgba(59,130,246,0.28),transparent_58%),radial-gradient(ellipse_40%_35%_at_20%_0%,rgba(59,130,246,0.16),transparent_60%)]" />

        {marketLive && quotes.length > 0 ? (
          <div className="border-b border-[var(--border)]/70 bg-[var(--card)]/55 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-1.5">
              <p className="text-[10px] font-medium text-muted">{copy.marketLive}</p>
            </div>
            <div className="mx-auto flex max-w-6xl overflow-hidden px-4">
              <div className="market-ticker py-2">
                {[...quotes, ...quotes].map((quote, i) => {
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
        ) : null}

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-14 md:grid-cols-[1.02fr_0.98fr] md:pb-20 md:pt-16">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-[11px] font-semibold text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              {copy.trusted}
            </span>
            <h1 className="mt-5 max-w-xl font-display text-4xl font-semibold leading-[1.03] tracking-tight md:text-6xl">
              {copy.heroTitleA}
              <br />
              {copy.heroTitleB}
              <br />
              <span className="bg-[linear-gradient(120deg,#0052ff,#65a3ff)] bg-clip-text text-transparent">
                {copy.heroTitleC}
              </span>
              <br />
              {copy.heroTitleD}
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted md:text-base">{copy.heroSub}</p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link href={ROUTES.register} className="btn-primary gap-2 px-5 py-2.5" onClick={() => track("cta_click", { source: "hero" })}>
                {copy.joinNow}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#hook" className="btn-ghost gap-2 px-5 py-2.5">
                <CirclePlay className="h-4 w-4" />
                {copy.demo}
              </Link>
            </div>

            {marketLive && quotes.length > 0 ? (
              <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-3 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                    {locale === "id" ? "Snapshot Pasar" : "Market Snapshot"}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {copy.marketLive}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {quotes.map((quote) => {
                    const positive = quote.change >= 0;
                    return (
                      <div
                        key={quote.symbol}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/70 px-3 py-2.5"
                      >
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
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="mt-6 text-xs text-muted">{copy.marketUnavailable}</p>
            )}
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
                  {copy.deskPreview}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {deskModules.map((m) => (
                  <div key={m.label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                    <p className="text-xs font-semibold">{m.label}</p>
                    <p className="mt-0.5 text-[10px] text-white/60">{m.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                  {locale === "id" ? "Alur Member" : "Member Flow"}
                </p>
                <ol className="mt-2 space-y-1.5 text-[11px] text-white/75">
                  <li>1. {locale === "id" ? "Daftar akun" : "Create account"}</li>
                  <li>2. {locale === "id" ? "Tonton tutorial broker" : "Watch broker tutorial"}</li>
                  <li>3. {locale === "id" ? "Daftar & verifikasi MT5" : "Register & verify MT5"}</li>
                  <li>4. {locale === "id" ? "Deposit & upload bukti" : "Deposit & upload proof"}</li>
                  <li>5. {locale === "id" ? "Buka fitur premium" : "Unlock premium features"}</li>
                </ol>
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

      <section className="mx-auto max-w-6xl px-4 py-10" id="how">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
          <p className="section-kicker">{t("landing.processKicker")}</p>
          <h2 className="section-title mt-2">{t("landing.processTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{copy.processTeaser}</p>
          <Link href={ROUTES.register} className="btn-primary mt-5 inline-flex gap-2" onClick={() => track("cta_click", { source: "process" })}>
            {copy.processCta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
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
                    <p className="mt-2 text-sm text-muted">
                      {t("member.entry")} {s.entry}
                    </p>
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
            { icon: BookOpen, title: copy.valueA, body: copy.valueABody },
            { icon: LineChart, title: copy.valueB, body: copy.valueBBody },
            { icon: Users, title: copy.valueC, body: copy.valueCBody },
            { icon: ShieldCheck, title: copy.valueD, body: copy.valueDBody },
          ].map((x) => (
            <article key={x.title} className="surface-panel p-4">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <x.icon className="h-4 w-4" />
              </span>
              <p className="mt-3 font-display text-base font-semibold">{x.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{x.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6" id="testimonials">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="section-kicker">{locale === "id" ? "Testimoni" : "Testimonials"}</p>
            <h2 className="section-title mt-2">{copy.testimonialTitle}</h2>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {testimonials.map((x) => (
            <article key={x.name} className="surface-panel p-5">
              <Quote className="h-4 w-4 text-accent" />
              <p className="mt-3 text-sm leading-relaxed text-muted">{x.text}</p>
              <div className="mt-4">
                <p className="text-sm font-semibold">{x.name}</p>
                <p className="text-xs text-muted">{x.role}</p>
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
              onClick={() => track("cta_click", { source: "footer_cta" })}
            >
              {copy.ctaBtn}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={ROUTES.login}
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              {locale === "id" ? "Masuk Member" : "Member Login"}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
