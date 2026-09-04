"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CirclePlay, Play, ShieldCheck } from "lucide-react";
import { LandingHookVideoPlayer } from "@/components/landing/LandingHookVideoPlayer";
import { LandingDeskPreview } from "@/components/landing/LandingDeskPreview";
import type { MarketQuote } from "@/components/landing/landing-types";
import { LandingXauusdEducation } from "@/components/marketing/LandingXauusdEducation";
import { ROUTES } from "@/constants";
import { track } from "@/lib/analytics";
import { getHookVideo, type HookVideo } from "@/services/landing";
import { useT } from "@/i18n/useT";

export default function LandingPage() {
  const { t, locale } = useT();
  const [hookVideo, setHookVideo] = useState<HookVideo | null>(null);
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
        const res = await getHookVideo();
        if (!alive) return;
        setHookVideo(res.success && res.data ? res.data : null);
      } catch {
        if (alive) setHookVideo(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

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
            "Grow Your Pips, The Santara Way.",
          joinNow: "Daftar Gratis",
          demo: "Lihat Demo",
          marketLive: "Data pasar · update ~45 detik",
          marketUnavailable: "Data pasar sementara tidak tersedia",
          deskPreview: "Pratinjau desk member",
          ctaTitle: "Siap mulai perjalanan trading Anda?",
          ctaBody:
            "Daftar gratis, pelajari materi edukasi, lalu selesaikan verifikasi saat siap membuka fitur premium.",
          ctaBtn: "Daftar Sekarang",
        }
      : {
          trusted: "Education · Analysis · Community",
          heroTitleA: "Learn Trading.",
          heroTitleB: "Market Analysis.",
          heroTitleC: "Community.",
          heroTitleD: "With Santara Pips.",
          heroSub:
            "Grow Your Pips, The Santara Way.",
          joinNow: "Register Free",
          demo: "Watch Demo",
          marketLive: "Market data · ~45s refresh",
          marketUnavailable: "Market data temporarily unavailable",
          deskPreview: "Member desk preview",
          ctaTitle: "Ready to start your trading journey?",
          ctaBody:
            "Register free, study the education material, then complete verification when you're ready for premium access.",
          ctaBtn: "Register Now",
        };

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
              <a href="#education" className="btn-ghost gap-2 px-5 py-2.5">
                <CirclePlay className="h-4 w-4" />
                {copy.demo}
              </a>
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
            <LandingDeskPreview locale={locale} quotes={quotes} />
            <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
              {hookVideo?.video_url ? (
                <LandingHookVideoPlayer
                  video={hookVideo}
                  fallbackTitle={t("landing.hookTitle")}
                  autoPlay={false}
                  loop={false}
                />
              ) : (
                <div className="flex aspect-video items-center justify-center gap-2 bg-[#0d1833]/90 text-white/90">
                  <Play className="h-5 w-5 fill-current" />
                  <p className="text-sm font-medium">{t("landing.hookTitle")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div id="education">
        <LandingXauusdEducation />
      </div>

      <section className="mx-auto max-w-6xl px-4 pb-24 pt-4">
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
