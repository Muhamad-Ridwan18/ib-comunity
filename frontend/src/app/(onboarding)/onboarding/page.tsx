"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  completeStep1,
  completeStep2,
  completeStep4,
  completeStep5,
  getOnboarding,
  resubmitVerification,
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
import { ROUTES } from "@/constants";

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

  const step = progress.current_step;
  const rejected = progress.status === "rejected";
  const pending = progress.status === "pending_verification";
  const verified = progress.status === "verified";

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
            <p className="section-kicker">Onboarding</p>
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
                  <p className="text-sm text-muted">
                    Learn how registration works with our broker before opening an account.
                  </p>
                  {progress.settings.broker_tutorial_url ? (
                    <a
                      href={progress.settings.broker_tutorial_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost mt-4 inline-flex"
                    >
                      Open tutorial
                    </a>
                  ) : null}
                </StepBody>
              )}

              {!rejected && step === 2 && (
                <StepBody title="Register via our IB link">
                  <p className="text-sm text-muted">
                    Open the IB registration link, create your broker account, then continue.
                  </p>
                  {progress.settings.ib_register_url ? (
                    <a
                      href={progress.settings.ib_register_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost mt-4 inline-flex"
                    >
                      Open IB link
                    </a>
                  ) : null}
                </StepBody>
              )}

              {!rejected && step === 3 && (
                <StepBody title="Submit MT5 details">
                  <label className="mt-2 block space-y-1.5 text-sm">
                    <span className="text-muted">MT5 account number</span>
                    <input className="field-input" value={mt5} onChange={(e) => setMt5(e.target.value)} />
                  </label>
                  <label className="mt-3 block space-y-1.5 text-sm">
                    <span className="text-muted">Broker server</span>
                    <input className="field-input" value={server} onChange={(e) => setServer(e.target.value)} />
                  </label>
                </StepBody>
              )}

              {!rejected && step === 4 && (
                <StepBody title="Deposit tutorial & proof">
                  <p className="text-sm text-muted">Review the deposit tutorial and optionally upload proof.</p>
                  {progress.settings.deposit_tutorial_url ? (
                    <a
                      href={progress.settings.deposit_tutorial_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost mt-4 inline-flex"
                    >
                      Open deposit tutorial
                    </a>
                  ) : null}
                  <label className="mt-4 block space-y-1.5 text-sm">
                    <span className="text-muted">Proof upload (optional)</span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      className="block w-full text-sm text-muted"
                      onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </StepBody>
              )}

              {!rejected && (step === 5 || pending) && (
                <StepBody title="Waiting for verification">
                  {pending || progress.step5_done_at ? (
                    <>
                      <p className="text-sm text-muted">
                        MT5 {progress.latest_verification?.mt5_account} ·{" "}
                        {progress.latest_verification?.broker_server}
                      </p>
                      <WaitingTimeline
                        submitted
                        pending={pending}
                        rejected={false}
                        verified={verified}
                      />
                    </>
                  ) : (
                    <p className="text-sm text-muted">Confirm to submit your application for admin review.</p>
                  )}
                </StepBody>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 mt-4 flex items-center justify-between gap-3 rounded-[1.25rem] border border-[var(--border)] bg-[var(--sidebar)] px-4 py-3 backdrop-blur">
            <button
              type="button"
              className="btn-ghost"
              disabled={busy || step <= 1 || rejected || pending}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Review steps
            </button>
            <div className="flex gap-2">
              {!rejected && step === 1 && (
                <button type="button" disabled={busy} className="btn-primary" onClick={() => void run(completeStep1)}>
                  Continue
                </button>
              )}
              {!rejected && step === 2 && (
                <button type="button" disabled={busy} className="btn-primary" onClick={() => void run(completeStep2)}>
                  I have registered
                </button>
              )}
              {!rejected && step === 3 && (
                <button
                  type="button"
                  disabled={busy || !mt5 || !server}
                  className="btn-primary"
                  onClick={() => void run(() => submitStep3({ mt5_account: mt5, broker_server: server }))}
                >
                  Submit MT5
                </button>
              )}
              {!rejected && step === 4 && (
                <button
                  type="button"
                  disabled={busy}
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
              )}
              {!rejected && step === 5 && !pending && !progress.step5_done_at && (
                <button type="button" disabled={busy} className="btn-primary" onClick={() => void run(completeStep5)}>
                  Submit for verification
                </button>
              )}
              {(pending || progress.step5_done_at) && (
                <button type="button" className="btn-primary" onClick={() => router.push(ROUTES.member)}>
                  Preview desk
                </button>
              )}
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
