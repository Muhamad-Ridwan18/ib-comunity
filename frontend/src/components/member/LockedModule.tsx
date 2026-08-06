"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { membershipCta } from "@/lib/membership";

export function LockedModule({ title }: { title: string }) {
  const status = useAuthStore((s) => s.user?.status);
  const cta = membershipCta(status);

  return (
    <div className="surface-panel p-8">
      <p className="section-kicker">Members only</p>
      <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        This module unlocks after broker (MT5 IB) verification. Browse the desk freely, then become a member when you’re
        ready.
      </p>
      <Link href={cta.href} className="btn-primary mt-6 inline-flex">
        {cta.label}
      </Link>
    </div>
  );
}
