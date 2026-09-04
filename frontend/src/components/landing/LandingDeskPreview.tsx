"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { MarketQuote } from "@/components/landing/landing-types";
import { ROUTES } from "@/constants";

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

function PerformanceChart({ values }: { values: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || values.length < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const w = rect.width;
      const h = rect.height;
      const padX = 6;
      const padY = 10;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = Math.max(max - min, 1e-9);

      const points = values.map((v, i) => ({
        x: padX + (i / (values.length - 1)) * (w - padX * 2),
        y: padY + (1 - (v - min) / range) * (h - padY * 2),
      }));

      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i += 1) {
        const y = padY + ((h - padY * 2) * i) / 5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const baseline = h - padY;
      const area = new Path2D();
      area.moveTo(points[0].x, baseline);
      points.forEach((p) => area.lineTo(p.x, p.y));
      area.lineTo(points[points.length - 1].x, baseline);
      area.closePath();

      const fill = ctx.createLinearGradient(0, padY, 0, baseline);
      fill.addColorStop(0, "rgba(74, 222, 128, 0.35)");
      fill.addColorStop(1, "rgba(74, 222, 128, 0.02)");
      ctx.fillStyle = fill;
      ctx.fill(area);

      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(74, 222, 128, 0.55)";
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      const last = points[points.length - 1];
      ctx.beginPath();
      ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#4ade80";
      ctx.fill();
      ctx.strokeStyle = "#052e1a";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [values]);

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden />;
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

function formatPrice(close: number) {
  return close >= 100 ? close.toLocaleString(undefined, { maximumFractionDigits: 2 }) : close.toFixed(4);
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
          viewAll: "Lihat Semua Sinyal",
        }
      : {
          winrate: "Winrate",
          rr: "Avg RR",
          signals: "Signals",
          members: "Members",
          performance: "Performance",
          latestSignals: "Latest Signals",
          live: "Live",
          viewAll: "View All Signals",
        };

  const stats = [
    { label: labels.winrate, value: "78.4%", change: 0.8 },
    { label: labels.rr, value: "1:2.7", change: 0.4 },
    { label: labels.signals, value: "342", change: 1.1 },
    { label: labels.members, value: "10.2k", change: 0.6 },
  ];

  const signalNotes = SIGNAL_NOTES[locale];
  const liveClose = priceHistory[priceHistory.length - 1] ?? lead.close;

  const performanceDelta = `${lead.change >= 0 ? "+" : ""}${lead.percent_change.toFixed(2)}%`;

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

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/50">{labels.performance}</p>
              <p className="mt-0.5 text-xs font-medium text-white/70">{lead.symbol}</p>
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-semibold tabular-nums transition-colors duration-150 ${
                  flash ? "text-emerald-200" : "text-white"
                }`}
              >
                {formatPrice(liveClose)}
              </p>
              <p
                className={`text-[11px] font-medium tabular-nums ${
                  lead.change >= 0 ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {performanceDelta}
              </p>
            </div>
          </div>

          <div className="relative mt-3 h-40 overflow-hidden rounded-lg border border-white/10 bg-[#081024] sm:h-44">
            <PerformanceChart values={priceHistory} />
            <div className="desk-chart-scan pointer-events-none absolute inset-0 z-[1]" aria-hidden />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-white/50">{labels.latestSignals}</p>
          <div className="space-y-2">
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
    </div>
  );
}
