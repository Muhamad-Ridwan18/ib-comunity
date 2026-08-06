"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  completeStep1,
  completeStep2,
  completeStep4,
  completeStep5,
  getOnboarding,
  resubmitVerification,
  startOnboarding,
  submitStep3,
  uploadProof,
  type OnboardingProgress,
} from "@/services/onboarding";
import { me } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { AppLogo } from "@/components/layout/AppLogo";
import { StepRail, WaitingTimeline } from "@/components/onboarding/StepRail";
import { Skeleton } from "@/components/ui/Skeleton";
import { ROUTES, USER_STATUS } from "@/constants";
import { isBrowseOnly } from "@/lib/membership";

export default function OnboardingPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const user = useAuthStore((s) => s.user);

  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mt5, setMt5] = useState("");
  const [server, setServer] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  useEffect(() => {
    document.body.classList.add("app-shell");
    return () => document.body.classList.remove("app-shell");
  }, []);

  const refreshUser = useCallback(async () => {
    if (!accessToken || !refreshToken) return;
    const res = await me();
    if (res.success && res.data) {
      setSession(res.data, accessToken, refreshToken);
      if (res.data.status === "verified") router.replace(ROUTES.member);
    }
  }, [accessToken, refreshToken, router, setSession]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOnboarding();
      if (!res.success || !res.data) {
        setError(res.message || "Failed to load onboarding");
        return;
      }
      setProgress(res.data);
      if (res.data.latest_verification) {
        setMt5(res.data.latest_verification.mt5_account);
        setServer(res.data.latest_verification.broker_server);
      }
      if (res.data.status === "verified") router.replace(ROUTES.member);
    } catch {
      setError("Cannot load onboarding. Are you logged in?");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (fn: () => Promise<{ success: boolean; message: string; data: OnboardingProgress | null }>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      if (!res.success || !res.data) {
        setError(res.message || "Action failed");
        return;
      }
      setProgress(res.data);
      await refreshUser();
    } catch {
      setError("Request failed");
    } finally {
      setBusy(false);
    }
  };

  const beginMembership = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await startOnboarding();
      if (!res.success || !res.data) {
        setError(res.message || "Could not start verification");
        return;
      }
      setProgress(res.data);
      await refreshUser();
    } catch {
      setError("Could not start verification");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 md:grid-cols-[240px_1fr]">
        <Skeleton className="h-72" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-[var(--danger)]">{error ?? "No progress"}</p>
      </div>
    );
  }

  // Browse-first: show intro until user opts into IB verification.
  if (isBrowseOnly(progress.status) || progress.status === USER_STATUS.registered) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6 md:py-10">
        <div className="mb-8 flex items-center justify-between gap-3">
          <AppLogo href={ROUTES.member} />
          <ThemeToggle />
        </div>
        <div className="surface-panel relative overflow-hidden p-8 md:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
          <p className="section-kicker">Membership</p>
          <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Become a verified member
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted md:text-base">
            You can keep browsing the desk as a guest account. When you want academy, signals, journal, bonuses, and
            Telegram, start the IB verification steps. An admin will review your MT5 account at the end.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-muted">
            <li>1. Watch broker tutorial</li>
            <li>2. Register under our IB</li>
            <li>3. Submit MT5 account details</li>
            <li>4. Deposit proof (optional)</li>
            <li>5. Wait for admin approval</li>
          </ul>
          {error ? (
            <p className="mt-4 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" disabled={busy} className="btn-primary px-6 py-3" onClick={() => void beginMembership()}>
              {busy ? "Starting…" : "Start verification"}
            </button>
            <Link href={ROUTES.member} className="btn-ghost px-6 py-3">
              Back to desk
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const step = progress.current_step;
  const rejected = progress.status === "rejected";
  const pending = progress.status === "pending_verification";

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 md:py-10">
      <div className="mb-8 flex items-center justify-between gap-3">
        <AppLogo href={ROUTES.member} />
        <div className="flex items-center gap-2">
          <p className="hidden text-xs text-muted sm:block">{user?.email}</p>
          <ThemeToggle />
        </div>
      </div>

      <div className="grid flex-1 gap-6 md:grid-cols-[240px_1fr]">
        <aside className="surface-panel h-fit p-4 md:sticky md:top-6">
          <p className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Steps</p>
          <StepRail progress={progress} />
        </aside>

        <div className="flex min-h-[28rem] flex-col">
          <div className="surface-panel flex-1 p-6 md:p-8">
            <p className="section-kicker">Membership</p>
            <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              IB verification setup
            </h1>
            <p className="mt-2 text-sm text-muted">Complete each step in order. Skipping is disabled.</p>

            {error ? (
              <p className="mt-4 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
                {error}
              </p>
            ) : null}

            {rejected ? (
              <div className="mt-6 rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/5 p-5">
                <p className="font-medium text-[var(--danger)]">Verification rejected</p>
                <p className="mt-2 text-sm text-muted">
                  {progress.latest_verification?.rejection_reason || "Please resubmit correct MT5 details."}
                </p>
                <button
                  type="button"
                  disabled={busy}
                  className="btn-primary mt-4"
                  onClick={() =>
                    void (async () => {
                      setBusy(true);
                      try {
                        await resubmitVerification();
                        await load();
                      } catch {
                        setError("Resubmit failed");
                      } finally {
                        setBusy(false);
                      }
                    })()
                  }
                >
                  Resubmit from step 3
                </button>
              </div>
            ) : null}

            <div className={`mt-6 ${busy ? "pointer-events-none opacity-60" : ""}`}>
              {!rejected && step === 1 && (
                <StepBody title="Watch the broker tutorial">
                  <a
                    href={progress.settings.broker_tutorial_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost inline-flex"
                  >
                    Open tutorial
                  </a>
                  <button type="button" className="btn-primary ml-3" onClick={() => void run(completeStep1)}>
                    Mark as watched
                  </button>
                </StepBody>
              )}

              {!rejected && step === 2 && (
                <StepBody title="Register under our IB">
                  <a
                    href={progress.settings.ib_register_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost inline-flex"
                  >
                    Open IB registration
                  </a>
                  <button type="button" className="btn-primary ml-3" onClick={() => void run(completeStep2)}>
                    I’ve registered
                  </button>
                </StepBody>
              )}

              {!rejected && step === 3 && (
                <StepBody title="Submit MT5 account">
                  <div className="mt-4 max-w-md space-y-3">
                    <label className="block space-y-1.5 text-sm">
                      <span className="text-muted">MT5 account number</span>
                      <input className="field-input" value={mt5} onChange={(e) => setMt5(e.target.value)} />
                    </label>
                    <label className="block space-y-1.5 text-sm">
                      <span className="text-muted">Broker server</span>
                      <input className="field-input" value={server} onChange={(e) => setServer(e.target.value)} />
                    </label>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => void run(() => submitStep3({ mt5_account: mt5, broker_server: server }))}
                    >
                      Save & continue
                    </button>
                  </div>
                </StepBody>
              )}

              {!rejected && step === 4 && (
                <StepBody title="Deposit tutorial & optional proof">
                  <a
                    href={progress.settings.deposit_tutorial_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost inline-flex"
                  >
                    Open deposit tutorial
                  </a>
                  <div className="mt-4 max-w-md space-y-3">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() =>
                        void run(async () => {
                          let proof_key: string | undefined;
                          if (proofFile) {
                            const up = await uploadProof(proofFile);
                            if (!up.success || !up.data) throw new Error("upload failed");
                            proof_key = up.data.key;
                          }
                          return completeStep4(proof_key ? { proof_key } : {});
                        })
                      }
                    >
                      Continue
                    </button>
                  </div>
                </StepBody>
              )}

              {!rejected && step === 5 && !pending && (
                <StepBody title="Submit for admin review">
                  <p className="text-sm text-muted">We’ll notify you when an admin reviews your MT5 details.</p>
                  <button type="button" className="btn-primary mt-4" onClick={() => void run(completeStep5)}>
                    Submit for verification
                  </button>
                </StepBody>
              )}

              {pending ? (
                <StepBody title="Waiting for verification">
                  <p className="text-sm text-muted">
                    MT5 {progress.latest_verification?.mt5_account} · {progress.latest_verification?.broker_server}
                  </p>
                  <WaitingTimeline
                    submitted
                    pending
                    rejected={false}
                    verified={false}
                  />
                  <Link href={ROUTES.member} className="btn-ghost mt-6 inline-flex">
                    Preview desk
                  </Link>
                </StepBody>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepBody({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}
