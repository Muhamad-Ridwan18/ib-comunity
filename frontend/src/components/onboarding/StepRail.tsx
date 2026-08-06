"use client";

import { cn } from "@/lib/utils";
import type { OnboardingProgress } from "@/services/onboarding";
import { useT } from "@/i18n/useT";

export const ONBOARDING_STEP_KEYS = ["steps.s1", "steps.s2", "steps.s3", "steps.s4", "steps.s5"] as const;

function stepDone(progress: OnboardingProgress, n: number) {
  return Boolean(
    (n === 1 && progress.step1_done_at) ||
      (n === 2 && progress.step2_done_at) ||
      (n === 3 && progress.step3_done_at) ||
      (n === 4 && progress.step4_done_at) ||
      (n === 5 && progress.step5_done_at),
  );
}

export function StepRail({ progress }: { progress: OnboardingProgress }) {
  const { t } = useT();
  const current = progress.current_step;
  return (
    <ol className="space-y-1">
      {ONBOARDING_STEP_KEYS.map((key, i) => {
        const n = i + 1;
        const done = stepDone(progress, n);
        const active = current === n;
        return (
          <li
            key={key}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
              active && "bg-accent-soft text-accent",
              done && !active && "text-muted",
              !done && !active && "text-muted/70",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold",
                active && "border-accent bg-accent text-[var(--btn-fg)]",
                done && !active && "border-accent/40 text-accent",
                !done && !active && "border-[var(--border)]",
              )}
            >
              {done && !active ? "✓" : n}
            </span>
            <span className={cn(active && "font-medium")}>{t(key)}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function WaitingTimeline({
  submitted,
  pending,
  rejected,
  verified,
}: {
  submitted: boolean;
  pending: boolean;
  rejected: boolean;
  verified: boolean;
}) {
  const { t } = useT();
  const stages = [
    { key: "submitted", label: t("onboarding.submitted"), on: submitted || pending || rejected || verified },
    { key: "review", label: t("onboarding.underReview"), on: pending || verified },
    {
      key: "result",
      label: verified ? t("onboarding.approved") : rejected ? t("status.rejected") : t("onboarding.resultLabel"),
      on: verified || rejected,
    },
  ];

  return (
    <ol className="mt-6 space-y-0">
      {stages.map((s, i) => (
        <li key={s.key} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "mt-1 h-2.5 w-2.5 rounded-full",
                s.on ? "bg-accent" : "bg-[var(--border)]",
              )}
            />
            {i < stages.length - 1 ? (
              <span className={cn("my-1 w-px flex-1 min-h-6", s.on ? "bg-accent/40" : "bg-[var(--border)]")} />
            ) : null}
          </div>
          <p className={cn("pb-5 text-sm", s.on ? "text-[var(--foreground)]" : "text-muted")}>{s.label}</p>
        </li>
      ))}
    </ol>
  );
}
