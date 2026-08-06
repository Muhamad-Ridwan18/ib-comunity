import Link from "next/link";
import { ROUTES } from "@/constants";

export function LockedModule({ title }: { title: string }) {
  return (
    <div className="surface-panel p-8">
      <p className="section-kicker">Locked</p>
      <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        This module unlocks after broker (MT5 IB) verification. Finish onboarding to access the full desk.
      </p>
      <Link href={ROUTES.onboarding} className="btn-primary mt-6 inline-flex">
        Continue verification
      </Link>
    </div>
  );
}
