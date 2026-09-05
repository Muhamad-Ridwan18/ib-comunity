"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { MarketQuote } from "@/components/landing/landing-types";
import { ROUTES } from "@/constants";

const FALLBACK_QUOTES: MarketQuote[] = [
  { symbol: "XAU/USD", name: "Gold", close: 2350.4, change: 12.8, percent_change: 0.55 },
  { symbol: "EUR/USD", name: "Euro", close: 1.0842, change: -0.0011, percent_change: -0.1 },
  { symbol: "GBP/USD", name: "Pound", close: 1.265, change: 0.0024, percent_change: 0.19 },
  { symbol: "BTC/USD", name: "Bitcoin", close: 62450, change: 880, percent_change: 1.43 },
];

const TICK_MS = 550;

const SIGNAL_NOTES = {
  id: ["Sweep → continuation", "HTF supply rejection"],
  en: ["Sweep → continuation", "HTF supply rejection"],
} as const;

function sparklinePoints(change: number, tick: number) {
  const seed = Math.max(6, Math.min(22, Math.round(Math.abs(change) * 10)));
  const values = Array.from({ length: 12 }, (_, i) => {
    const wave = Math.sin(tick / 3.5 + i * 0.65) * 5;
    const base = [28, 34, 31, 38, 36, 44, 41, 47, 52, 56, 61, 58][i] ?? 40;
    return change >= 0 ? base + ((seed + i * 2) % 12) + wave : base - ((seed + i * 2) % 10) + wave;
  });
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

function formatPrice(close: number) {
  return close >= 100 ? close.toLocaleString(undefined, { maximumFractionDigits: 2 }) : close.toFixed(4);
}

type Props = {
  locale: "id" | "en";
  quotes: MarketQuote[];
};

export function LandingDeskPreview({ locale, quotes }: Props) {
  const liveQuotes = quotes.length > 0 ? quotes : FALLBACK_QUOTES;
  const [tick, setTick] = useState(0);

  const labels =
    locale === "id"
      ? {
          winrate: "Winrate",
          rr: "RR Rata-rata",
          signals: "Sinyal",
          members: "Member",
          latestSignals: "Sinyal Terbaru",
          viewAll: "Lihat Semua Sinyal",
        }
      : {
          winrate: "Winrate",
          rr: "Avg RR",
          signals: "Signals",
          members: "Members",
          latestSignals: "Latest Signals",
          viewAll: "View All Signals",
        };

  const stats = [
    { label: labels.winrate, value: "78.4%", change: 0.8 },
    { label: labels.rr, value: "1:2.7", change: 0.4 },
    { label: labels.signals, value: "342", change: 1.1 },
    { label: labels.members, value: "10.2k", change: 0.6 },
  ];

  const signalNotes = SIGNAL_NOTES[locale];

  useEffect(() => {
    let alive = true;
    let last = performance.now();

    const loop = (now: number) => {
      if (!alive) return;
      if (now - last >= TICK_MS) {
        last = now;
        setTick((n) => n + 1);
      }
      requestAnimationFrame(loop);
    };

    const id = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(id);
    };
  }, []);

  return (
    <div className="relative rounded-2xl border border-white/10 bg-[#0d1833]/95 p-4 text-white shadow-[0_20px_60px_rgba(8,16,40,0.45)] backdrop-blur">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((x) => (
          <div key={x.label} className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-2.5">
            <p className="text-[10px] text-white/55">{x.label}</p>
            <div className="mt-1 flex items-end justify-between gap-1">
              <p className="text-sm font-semibold tabular-nums">{x.value}</p>
              <div className="h-6 w-10 shrink-0">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                  <polyline
                    fill="none"
                    stroke="#4ade80"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    points={sparklinePoints(x.change, tick)}
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-white/50">{labels.latestSignals}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {liveQuotes.slice(0, 2).map((quote, i) => {
            const positive = quote.change >= 0;
            return (
              <div key={quote.symbol} className="rounded-lg border border-white/10 bg-[#081024]/70 px-2.5 py-2">
                <div className="flex items-center justify-between gap-1">
                  <p className="truncate text-[11px] font-semibold">{quote.symbol}</p>
                  <span className={`text-[10px] font-semibold ${positive ? "text-emerald-300" : "text-rose-300"}`}>
                    {positive ? "BUY" : "SELL"}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[10px] tabular-nums text-white/80">{formatPrice(quote.close)}</p>
                <p className="mt-0.5 truncate text-[10px] text-white/50">{signalNotes[i] ?? quote.name}</p>
                <div className="mt-2 h-7">
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                    <polyline
                      fill="none"
                      stroke={positive ? "#4ade80" : "#fb7185"}
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      points={sparklinePoints(quote.percent_change, tick + i * 3)}
                    />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
        <Link
          href={ROUTES.signals}
          className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-[#7eb6ff] hover:text-white"
        >
          {labels.viewAll}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
