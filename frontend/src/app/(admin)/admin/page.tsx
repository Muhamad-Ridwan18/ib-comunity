"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { listAdminVerifications, type VerificationRequest } from "@/services/onboarding";
import { adminListTickets, type Ticket } from "@/services/tickets";
import { formatRelativeTime } from "@/components/admin/AdminChrome";

export default function AdminDashboardPage() {
  const [verifs, setVerifs] = useState<VerificationRequest[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);

  useEffect(() => {
    void (async () => {
      try {
        const [v, t, open] = await Promise.all([
          listAdminVerifications({ status: "pending", page: 1 }),
          adminListTickets({ page: 1 }),
          adminListTickets({ status: "open", page: 1 }),
        ]);
        if (v.success && v.data) {
          setVerifs(v.data.slice(0, 6));
          setPendingCount(v.meta?.total ?? v.data.length);
        }
        if (t.success && t.data) setTickets(t.data.slice(0, 6));
        if (open.success) setOpenTickets(open.meta?.total ?? open.data?.length ?? 0);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const metrics = [
    { label: "Pending verifications", value: pendingCount, href: "/admin/verifications" },
    { label: "Open tickets", value: openTickets, href: "/admin/tickets" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight md:text-2xl">Overview</h1>
        <p className="mt-1 text-sm text-muted">Queues that need attention today.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
        {metrics.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-4 transition hover:border-accent/30"
          >
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">{m.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold tracking-tight">{m.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <h2 className="text-sm font-semibold">Pending verifications</h2>
            <Link href="/admin/verifications" className="text-xs font-medium text-accent">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {verifs.map((v) => (
              <li key={v.id}>
                <Link
                  href="/admin/verifications"
                  className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-[var(--surface-2)]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{v.user_full_name || v.user_email || v.mt5_account}</p>
                    <p className="truncate text-xs text-muted">
                      {v.mt5_account} · {v.broker_server} · {formatRelativeTime(v.created_at)}
                    </p>
                  </div>
                  <StatusBadge label={v.status} tone={statusTone(v.status)} />
                </Link>
              </li>
            ))}
            {verifs.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-muted">Queue clear</li>
            ) : null}
          </ul>
        </section>

        <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <h2 className="text-sm font-semibold">Recent tickets</h2>
            <Link href="/admin/tickets" className="text-xs font-medium text-accent">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {tickets.map((t) => (
              <li key={t.id}>
                <Link
                  href="/admin/tickets"
                  className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-[var(--surface-2)]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.topic}</p>
                    <p className="truncate text-xs text-muted">
                      {t.name} · {formatRelativeTime(t.updated_at || t.created_at)}
                    </p>
                  </div>
                  <StatusBadge label={t.status} tone={statusTone(t.status)} />
                </Link>
              </li>
            ))}
            {tickets.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-muted">No tickets</li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
