"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MarketQuote } from "@/components/landing/landing-types";

const FALLBACK_QUOTES: MarketQuote[] = [
  { symbol: "XAU/USD", name: "Gold", close: 2350.4, change: 12.8, percent_change: 0.55 },
  { symbol: "EUR/USD", name: "Euro", close: 1.0842, change: -0.0011, percent_change: -0.1 },
  { symbol: "GBP/USD", name: "Pound", close: 1.265, change: 0.0024, percent_change: 0.19 },
  { symbol: "BTC/USD", name: "Bitcoin", close: 62450, change: 880, percent_change: 1.43 },
];

const HISTORY_LEN = 28;
const TICK_MS = 550;

const SIGNAL_NOTES = {
  id: ["Sweep → continuation", "HTF supply rejection"],
  en: ["Sweep → continuation", "HTF supply rejection"],
} as const;

function primaryQuote(quotes: MarketQuote[]) {
  return quotes[0] ?? FALLBACK_QUOTES[0];
}

function initPriceHistory(anchor: number) {
  const spread = Math.max(anchor * 0.00025, 0.0004);
  return Array.from({ length: HISTORY_LEN }, (_, i) => anchor + Math.sin(i * 0.55) * spread);
}

function nextPriceTick(prev: number, anchor: number, t: number) {
  const spread = Math.max(anchor * 0.00022, 0.00035);
  const wave = Math.sin(t / 420 + prev * 0.001) * spread;
  const jitter = (Math.random() - 0.5) * spread * 0.35;
  const pull = (anchor - prev) * 0.08;
  return prev + wave + jitter + pull;
}

function normalizeSeries(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1e-9);
  return values.map((v) => 18 + ((v - min) / range) * 64);
}

function performanceChartPaths(values: number[]) {
  const width = 100;
  const height = 100;
  const pad = 6;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);

  const points = values.map((v, i) => ({
    x: pad + (i / (values.length - 1)) * (width - pad * 2),
    y: pad + (1 - (v - min) / range) * (height - pad * 2),
  }));

  const line = points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const area = [
    `M ${points[0].x.toFixed(2)},${height - pad}`,
    ...points.map((p) => `L ${p.x.toFixed(2)},${p.y.toFixed(2)}`),
    `L ${points[points.length - 1].x.toFixed(2)},${height - pad}`,
    "Z",
  ].join(" ");

  const bars = points.map((p) => ({
    x: p.x,
    h: Math.max(8, height - pad - p.y),
  }));

  return { line, area, last: points[points.length - 1], bars, height, pad };
}

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

function formatPrice(q: MarketQuote) {
  return q.close >= 100 ? q.close.toLocaleString(undefined, { maximumFractionDigits: 2 }) : q.close.toFixed(4);
}

type Props = {
  locale: "id" | "en";
  quotes: MarketQuote[];
};

export function LandingDeskPreview({ locale, quotes }: Props) {
  const liveQuotes = quotes.length > 0 ? quotes : FALLBACK_QUOTES;
  const lead = primaryQuote(liveQuotes);

  const [priceHistory, setPriceHistory] = useState<number[]>(() => initPriceHistory(lead.close));
  const [tick, setTick] = useState(0);
  const [flash, setFlash] = useState(false);
  const anchorRef = useRef(lead.close);
  const timeRef = useRef(0);

  const labels =
    locale === "id"
      ? {
          winrate: "Winrate",
          rr: "RR Rata-rata",
          signals: "Sinyal",
          members: "Member",
          performance: "Performa",
          latestSignals: "Sinyal Terbaru",
          live: "Live",
          symbol: lead.symbol.replace("/", ""),
        }
      : {
          winrate: "Winrate",
          rr: "Avg RR",
          signals: "Signals",
          members: "Members",
          performance: "Performance",
          latestSignals: "Latest Signals",
          live: "Live",
          symbol: lead.symbol.replace("/", ""),
        };

  const stats = [
    { label: labels.winrate, value: "78.4%" },
    { label: labels.rr, value: "1:2.7" },
    { label: labels.signals, value: "342" },
    { label: labels.members, value: "10.2k" },
  ];

  const signalNotes = SIGNAL_NOTES[locale];

  const chartValues = useMemo(() => normalizeSeries(priceHistory), [priceHistory]);
  const chart = useMemo(() => performanceChartPaths(chartValues), [chartValues]);

  const performanceDelta = `${lead.change >= 0 ? "+" : ""}${lead.percent_change.toFixed(2)}%`;
  const livePrice = formatPrice({ ...lead, close: priceHistory[priceHistory.length - 1] ?? lead.close });

  useEffect(() => {
    anchorRef.current = lead.close;
  }, [lead.close]);

  useEffect(() => {
    let alive = true;
    let last = performance.now();

    const loop = (now: number) => {
      if (!alive) return;
      if (now - last >= TICK_MS) {
        last = now;
        timeRef.current = now;
        setTick((n) => n + 1);
        setFlash(true);
        window.setTimeout(() => setFlash(false), 180);
        setPriceHistory((prev) => {
          const lastPrice = prev[prev.length - 1] ?? anchorRef.current;
          const next = nextPriceTick(lastPrice, anchorRef.current, now);
          return [...prev.slice(1), next];
        });
      }
      requestAnimationFrame(loop);
    };

    const id = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(id);
    };
  }, []);

  useEffect(() => {
    setPriceHistory((prev) => {
      const next = [...prev];
      next[next.length - 1] = lead.close;
      return next;
    });
  }, [lead.close]);

  return (
    <div className="relative rounded-2xl border border-white/10 bg-[#0d1833]/90 p-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white/80">Santara Pips</p>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-2 py-1 text-[10px] text-white/80">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          {labels.live}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {stats.map((x) => (
          <div key={x.label} className="rounded-xl border border-white/10 bg-white/5 px-2 py-2">
            <p className="text-[10px] text-white/60">{x.label}</p>
            <p className="mt-0.5 text-xs font-semibold tabular-nums">{x.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-white/70">{labels.performance}</p>
            <p className="text-[10px] text-white/45">{labels.symbol}</p>
          </div>
          <div className="text-right">
            <p
              className={`text-xs font-semibold tabular-nums transition-colors duration-150 ${
                flash ? "text-emerald-200" : "text-white"
              }`}
            >
              {livePrice}
            </p>
            <p
              className={`text-[10px] font-medium tabular-nums ${
                lead.change >= 0 ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {performanceDelta}
            </p>
          </div>
        </div>

        <div className="desk-chart-scan relative mt-3 h-28 overflow-hidden rounded-lg border border-white/10 bg-[#081024]">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
            <defs>
              <linearGradient id="deskPerfFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4d88ff" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#4d88ff" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="deskPerfLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7bb1ff" />
                <stop offset="100%" stopColor="#4ade80" />
              </linearGradient>
            </defs>

            {[20, 40, 60, 80].map((y) => (
              <line key={y} x1="6" x2="94" y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.6" />
            ))}

            {chart.bars.map((bar, i) => (
              <rect
                key={`bar-${i}-${tick}`}
                x={bar.x - 1.1}
                y={chart.height - chart.pad - bar.h * 0.35}
                width="2.2"
                height={bar.h * 0.35}
                fill="rgba(77,136,255,0.18)"
                className="desk-bar"
              />
            ))}

            <path d={chart.area} fill="url(#deskPerfFill)" />
            <polyline
              fill="none"
              stroke="url(#deskPerfLine)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={chart.line}
              className="desk-line"
            />
            <circle cx={chart.last.x} cy={chart.last.y} r="2.4" fill="#4ade80">
              <animate attributeName="r" values="2.2;3.4;2.2" dur="1.2s" repeatCount="indefinite" />
            </circle>
            <circle cx={chart.last.x} cy={chart.last.y} r="5" fill="#4ade80" opacity="0.15">
              <animate attributeName="r" values="4;7;4" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0.05;0.2" dur="1.2s" repeatCount="indefinite" />
            </circle>
          </svg>
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
                <p className="mt-0.5 truncate text-[10px] tabular-nums text-white/80">{formatPrice(quote)}</p>
                <p className="mt-0.5 truncate text-[10px] text-white/50">{signalNotes[i] ?? quote.name}</p>
                <div className="mt-2 h-8">
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                    <polyline
                      fill="none"
                      stroke={positive ? "#4ade80" : "#fb7185"}
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={sparklinePoints(quote.percent_change, tick + i * 3)}
                      className="desk-line"
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
