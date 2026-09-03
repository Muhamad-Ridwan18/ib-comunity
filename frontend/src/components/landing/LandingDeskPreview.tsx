"use client";

import type { MarketQuote } from "@/components/landing/landing-types";

const FALLBACK_QUOTES: MarketQuote[] = [
  { symbol: "XAU/USD", name: "Gold", close: 2350.4, change: 12.8, percent_change: 0.55 },
  { symbol: "EUR/USD", name: "Euro", close: 1.0842, change: -0.0011, percent_change: -0.1 },
  { symbol: "GBP/USD", name: "Pound", close: 1.265, change: 0.0024, percent_change: 0.19 },
  { symbol: "BTC/USD", name: "Bitcoin", close: 62450, change: 880, percent_change: 1.43 },
];

const SIGNAL_NOTES = {
  id: ["Sweep → continuation", "HTF supply rejection"],
  en: ["Sweep → continuation", "HTF supply rejection"],
} as const;

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

type Props = {
  locale: "id" | "en";
  quotes: MarketQuote[];
  deskPreviewLabel: string;
  deskModules: { label: string; desc: string }[];
};

export function LandingDeskPreview({ locale, quotes, deskPreviewLabel, deskModules }: Props) {
  const liveQuotes = quotes.length > 0 ? quotes : FALLBACK_QUOTES;
  const labels =
    locale === "id"
      ? {
          performance: "Performa",
          latestSignals: "Sinyal Terbaru",
          pips: "pips",
        }
      : {
          performance: "Performance",
          latestSignals: "Latest Signals",
          pips: "pips",
        };

  const barHeights = liveQuotes.map((q, i) => 35 + Math.min(40, Math.max(4, Math.abs(q.percent_change) * 18 + i * 7)));
  const performanceDelta = liveQuotes[0]
    ? `${liveQuotes[0].change >= 0 ? "+" : ""}${liveQuotes[0].change >= 100 ? liveQuotes[0].change.toFixed(0) : liveQuotes[0].change.toFixed(2)}`
    : locale === "id"
      ? "+120 pips"
      : "+120 pips";

  const signalNotes = SIGNAL_NOTES[locale];

  return (
    <div className="relative rounded-2xl border border-white/10 bg-[#0d1833]/90 p-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white/80">Santara Pips</p>
        <span className="rounded-md border border-white/15 px-2 py-1 text-[10px] text-white/80">{deskPreviewLabel}</span>
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
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/70">{labels.performance}</p>
          <p className="text-[10px] font-medium text-emerald-300">{performanceDelta}</p>
        </div>
        <div className="mt-3 h-20 rounded-lg border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),transparent)] p-2 sm:h-24">
          <div className="flex h-full items-end gap-1.5">
            {barHeights.map((h, i) => (
              <span
                key={i}
                className="w-full rounded-sm bg-[linear-gradient(180deg,#7bb1ff,#4d88ff)]/90 transition-[height] duration-500"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-white/50">{labels.latestSignals}</p>
        <div className="grid grid-cols-2 gap-2">
          {liveQuotes.slice(0, 2).map((quote, i) => {
            const positive = quote.change >= 0;
            return (
              <div key={quote.symbol} className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">
                <div className="flex items-center justify-between gap-1">
                  <p className="truncate text-[11px] font-semibold">{quote.symbol.replace("/", "")}</p>
                  <span className={`text-[10px] font-semibold ${positive ? "text-emerald-300" : "text-rose-300"}`}>
                    {positive ? "BUY" : "SELL"}
                  </span>
                </div>
                <p className="mt-1 truncate text-[10px] text-white/70">{signalNotes[i] ?? quote.name}</p>
                <div className="mt-2 h-7">
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                    <polyline
                      fill="none"
                      stroke={positive ? "#4ade80" : "#fb7185"}
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
  );
}
