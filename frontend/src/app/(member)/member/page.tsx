"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { ROUTES } from "@/constants";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRail } from "@/components/ui/Skeleton";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { ArticleCard, ContentRail, MediaCard } from "@/components/member/ContentRail";
import { listContents, listContinue, type ContentItem } from "@/services/content";
import { listSignals, type SignalItem } from "@/services/signals";
import { getTelegramLink, listBonuses, type BonusItem } from "@/services/bonus";
import { getOnboarding } from "@/services/onboarding";
import { isBrowseOnly, membershipCta } from "@/lib/membership";
import { USER_STATUS } from "@/constants";

function progressPct(status?: string) {
  switch (status) {
    case "verified":
      return 100;
    case "pending_verification":
      return 90;
    case "rejected":
      return 60;
    case "onboarding":
      return 40;
    case "registered":
      return 10;
    default:
      return 10;
  }
}

async function soft<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export default function MemberDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const verified =
    user?.status === "verified" || user?.role === "admin" || user?.role === "super_admin";
  const firstName = user?.profile?.full_name?.split(" ")[0] || "Member";
  const pct = progressPct(user?.status);

  const [loading, setLoading] = useState(true);
  const [continueItems, setContinueItems] = useState<ContentItem[]>([]);
  const [academy, setAcademy] = useState<ContentItem[]>([]);
  const [analysis, setAnalysis] = useState<ContentItem[]>([]);
  const [psychology, setPsychology] = useState<ContentItem[]>([]);
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [bonuses, setBonuses] = useState<BonusItem[]>([]);
  const [telegram, setTelegram] = useState("");
  const [stepLabel, setStepLabel] = useState("");

  useEffect(() => {
    if (!hydrated) return;
    let alive = true;
    void (async () => {
      setLoading(true);
      try {
        const [a, ac, psy] = await Promise.all([
          soft(() => listContents({ module: "daily_analysis" })),
          soft(() => listContents({ module: "academy" })),
          soft(() => listContents({ module: "psychology" })),
        ]);
        if (!alive) return;
        if (a?.success && a.data) setAnalysis(a.data.slice(0, 8));
        if (ac?.success && ac.data) setAcademy(ac.data.slice(0, 8));
        if (psy?.success && psy.data) setPsychology(psy.data.slice(0, 8));

        if (!verified) {
          const ob = await soft(() => getOnboarding());
          if (alive && ob?.success && ob.data) setStepLabel(`Step ${ob.data.current_step} of 5`);
        } else {
          const [c, s, b, t] = await Promise.all([
            soft(() => listContinue()),
            soft(() => listSignals({ status: "active" })),
            soft(() => listBonuses()),
            soft(() => getTelegramLink()),
          ]);
          if (!alive) return;
          const continued = c?.success && c.data ? c.data.slice(0, 8) : [];
          setContinueItems(continued);
          if (s?.success && s.data) setSignals(s.data.slice(0, 6));
          if (b?.success && b.data) setBonuses(b.data.slice(0, 6));
          if (t?.success && t.data?.telegram_invite_url) setTelegram(t.data.telegram_invite_url);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [hydrated, verified, accessToken]);

  const cta = membershipCta(user?.status);
  const continueRail = continueItems.length ? continueItems : academy.slice(0, 6);
  const articles = psychology.length ? psychology : academy.filter((i) => i.type === "article");

  return (
    <div className="space-y-10 md:space-y-12">
      <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_80%_at_100%_0%,var(--glow),transparent_60%)]" />
        <div className="relative flex flex-col gap-6 px-5 py-6 sm:px-7 sm:py-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="section-kicker">{verified ? "Member desk" : "Your desk"}</p>
            <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight md:text-[2.35rem]">
              Welcome back, {firstName}
            </h1>
            <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-muted md:text-[0.95rem]">
              {verified
                ? "Pick up a lesson, review today’s analysis, or check the latest desk signals."
                : isBrowseOnly(user?.status)
                  ? "Explore public lessons and previews. Become a member when you’re ready for IB verification."
                  : user?.status === USER_STATUS.pending_verification
                    ? "Your MT5 verification is with the admin team. You can keep browsing while you wait."
                    : "Finish IB verification to unlock signals, journal, bonuses, and full academy access."}
            </p>
          </div>
          {!verified ? (
            <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/80 p-4 backdrop-blur">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {isBrowseOnly(user?.status) ? "Membership" : "Verification"}
                </span>
                <span className="font-semibold text-accent">{pct}%</span>
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white dark:bg-[var(--card)]">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted">{stepLabel || user?.status?.replaceAll("_", " ")}</p>
              <Link href={cta.href} className="btn-primary mt-3 inline-flex w-full sm:w-auto">
                {cta.label}
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Link href={ROUTES.academy} className="btn-primary">
                Browse Academy
              </Link>
              <Link href={ROUTES.signals} className="btn-ghost">
                View Signals
              </Link>
            </div>
          )}
        </div>
      </section>

      {loading || !hydrated ? (
        <div className="space-y-10">
          <SkeletonRail />
          <SkeletonRail />
        </div>
      ) : (
        <>
          {/* Continue Learning */}
          <ContentRail title="Continue Learning" href={ROUTES.academy}>
            {!verified ? (
              <EmptyState
                title="Unlock your learning path"
                description="After MT5 verification, progress and continue rails appear here."
                actionLabel={cta.label}
                actionHref={cta.href}
              />
            ) : continueRail.length === 0 ? (
              <EmptyState
                title="Start your first lesson"
                description="Academy content will show here as you watch and read."
                actionLabel="Browse academy"
                actionHref={ROUTES.academy}
              />
            ) : (
              <div className="rail-scroll">
                {continueRail.map((item) => (
                  <MediaCard key={item.id} item={item} hrefBase={ROUTES.academy} large />
                ))}
              </div>
            )}
          </ContentRail>

          {/* Daily Analysis */}
          <ContentRail title="Daily Market Analysis" href={ROUTES.analysis}>
            {analysis.length === 0 ? (
              <EmptyState
                title="No analysis yet"
                description="Desk market reads will appear in this carousel when published."
              />
            ) : (
              <div className="rail-scroll">
                {analysis.map((item) => (
                  <MediaCard key={item.id} item={item} hrefBase={ROUTES.analysis} />
                ))}
              </div>
            )}
          </ContentRail>

          {/* Trading Signals */}
          <ContentRail title="Trading Signals" href={ROUTES.signals}>
            {!verified ? (
              <EmptyState
                title="Signals are member-only"
                description="Active setups with entry, SL, and TP unlock after verification."
                actionLabel={cta.label}
                actionHref={cta.href}
              />
            ) : signals.length === 0 ? (
              <EmptyState title="No active signals" description="When the desk publishes setups, they will appear here." />
            ) : (
              <div className="rail-scroll">
                {signals.map((s) => (
                  <article
                    key={s.id}
                    className="w-72 shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:-translate-y-0.5 hover:border-accent/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-2xl font-semibold tracking-tight">{s.pair}</p>
                        <p className="mt-1 text-sm text-muted">
                          Entry {s.entry}
                          {s.sl != null ? ` · SL ${s.sl}` : ""}
                          {s.tp != null ? ` · TP ${s.tp}` : ""}
                        </p>
                      </div>
                      <StatusBadge
                        label={s.direction}
                        tone={s.direction === "buy" ? "accent" : "danger"}
                      />
                    </div>
                    {s.analysis ? <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted">{s.analysis}</p> : null}
                    <div className="mt-4">
                      <StatusBadge label={s.status} tone={statusTone(s.status)} />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </ContentRail>

          {/* Academy */}
          <ContentRail title="Academy" href={ROUTES.academy}>
            {academy.length === 0 ? (
              <EmptyState title="Academy is empty" description="Lessons will appear here as the desk publishes." />
            ) : (
              <div className="rail-scroll">
                {academy.map((item) => (
                  <MediaCard key={item.id} item={item} hrefBase={ROUTES.academy} />
                ))}
              </div>
            )}
          </ContentRail>

          {/* Latest Articles */}
          <ContentRail title="Latest Articles" href={ROUTES.psychology}>
            {articles.length === 0 ? (
              <EmptyState title="No articles yet" description="Written primers and psychology notes will land here." />
            ) : (
              <div className="rail-scroll">
                {articles.map((item) => (
                  <ArticleCard
                    key={item.id}
                    item={item}
                    hrefBase={item.module === "psychology" ? ROUTES.psychology : ROUTES.academy}
                  />
                ))}
              </div>
            )}
          </ContentRail>

          {/* Bonuses + Telegram */}
          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
            <ContentRail title="Member Bonuses" href={ROUTES.bonus} className="space-y-4">
              {!verified ? (
                <EmptyState
                  title="Bonuses unlock after verify"
                  description="Downloads and private resources appear here for verified members."
                  actionLabel={cta.label}
                  actionHref={cta.href}
                />
              ) : bonuses.length === 0 ? (
                <EmptyState title="No bonuses yet" description="Member resources will show here when published." />
              ) : (
                <div className="rail-scroll">
                  {bonuses.map((b) => (
                    <article
                      key={b.id}
                      className="w-64 shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-accent/30"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <h3 className="mt-4 font-display text-base font-semibold">{b.title}</h3>
                      {b.description ? <p className="mt-2 line-clamp-3 text-sm text-muted">{b.description}</p> : null}
                      {b.external_url || b.file_url ? (
                        <a
                          href={b.external_url || b.file_url || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex text-sm font-medium text-accent hover:underline"
                        >
                          Open resource
                        </a>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </ContentRail>

            <section className="relative overflow-hidden rounded-2xl bg-[linear-gradient(155deg,#0052ff_0%,#0039c7_100%)] p-6 text-white">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">Community</p>
              <h2 className="font-display mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Telegram</h2>
              <p className="mt-2.5 text-sm leading-relaxed text-white/80">
                Private desk updates and member discussion after verification.
              </p>
              {verified && telegram ? (
                <a
                  href={telegram}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-accent transition hover:bg-white/95"
                >
                  <Send className="h-4 w-4" />
                  Open Telegram
                </a>
              ) : (
                <Link
                  href={verified ? ROUTES.bonus : cta.href}
                  className="mt-6 inline-flex rounded-xl border border-white/25 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  {verified ? "Open Bonus" : cta.label}
                </Link>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
