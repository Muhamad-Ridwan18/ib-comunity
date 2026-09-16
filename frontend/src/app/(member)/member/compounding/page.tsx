"use client";

import { useMemo, useState } from "react";
import { LockedModule } from "@/components/member/LockedModule";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuthStore } from "@/store/auth";
import { isVerifiedMember } from "@/lib/membership";
import { useT } from "@/i18n/useT";

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function CompoundingCalculatorPage() {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const unlocked = isVerifiedMember(user);
  const [initial, setInitial] = useState("1000");
  const [dailyPct, setDailyPct] = useState("0.5");
  const [days, setDays] = useState("30");
  const [dailyDeposit, setDailyDeposit] = useState("0");

  const result = useMemo(() => {
    const start = Number(initial) || 0;
    const rate = (Number(dailyPct) || 0) / 100;
    const period = Math.max(0, Math.floor(Number(days) || 0));
    const deposit = Number(dailyDeposit) || 0;
    let balance = start;
    const rows: { day: number; balance: number; gain: number }[] = [];

    for (let d = 1; d <= period; d += 1) {
      const before = balance + deposit;
      balance = before * (1 + rate);
      rows.push({ day: d, balance, gain: balance - before });
    }

    return {
      final: balance,
      profit: balance - start - deposit * period,
      rows,
    };
  }, [initial, dailyPct, days, dailyDeposit]);

  if (!unlocked) return <LockedModule title={t("member.compounding")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("member.toolsKicker")}
        title={t("member.compounding")}
        description={t("member.compoundingDesc")}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">{t("member.compoundingInitial")}</span>
              <input className="field-input" inputMode="decimal" value={initial} onChange={(e) => setInitial(e.target.value)} />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">{t("member.compoundingDailyDeposit")}</span>
              <input
                className="field-input"
                inputMode="decimal"
                value={dailyDeposit}
                onChange={(e) => setDailyDeposit(e.target.value)}
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">{t("member.compoundingDailyReturn")}</span>
              <input className="field-input" inputMode="decimal" value={dailyPct} onChange={(e) => setDailyPct(e.target.value)} />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">{t("member.compoundingDays")}</span>
              <input className="field-input" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} />
            </label>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-4">
              <p className="text-xs uppercase tracking-wide text-muted">{t("member.compoundingFinal")}</p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{formatMoney(result.final)}</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-4">
              <p className="text-xs uppercase tracking-wide text-muted">{t("member.compoundingProfit")}</p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{formatMoney(result.profit)}</p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <p className="text-sm font-medium">{t("member.compoundingProjection")}</p>
          </div>
          <div className="max-h-[28rem] overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-[var(--card)] text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-2">{t("member.compoundingDay")}</th>
                  <th className="px-4 py-2">{t("member.compoundingGain")}</th>
                  <th className="px-4 py-2">{t("member.compoundingBalance")}</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.day} className="border-t border-[var(--border)]">
                    <td className="px-4 py-2 tabular-nums">{row.day}</td>
                    <td className="px-4 py-2 tabular-nums">{formatMoney(row.gain)}</td>
                    <td className="px-4 py-2 tabular-nums">{formatMoney(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
